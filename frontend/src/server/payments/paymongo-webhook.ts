import { createHmac, timingSafeEqual } from "crypto";
import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  DonationVerificationStatus,
} from "@prisma/client";
import { prisma } from "../db";
import { parseHideAmountPublicMetadata } from "../donations/hide-amount";
import { isPrismaUniqueConflict } from "../prisma-errors";
import { PaymentHttpError } from "./errors";
import {
  retrievePaymentIntent,
  type PaymongoPaymentIntentAttrs,
} from "./paymongo";

function timingSafeEqualAscii(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Parse `t=...,te=...,li=...` (values are hex, no `=` inside). */
function parsePaymongoSignatureHeader(header: string): { t: string; te: string; li: string } {
  const out = { t: "", te: "", li: "" };
  for (const part of header.split(",").map((s) => s.trim())) {
    const eq = part.indexOf("=");
    if (eq < 1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key === "t") out.t = val;
    else if (key === "te") out.te = val;
    else if (key === "li") out.li = val;
  }
  return out;
}

export function verifySignature(rawBody: Buffer, header: string | undefined): void {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new PaymentHttpError(
      503,
      "PayMongo webhooks are not configured (missing PAYMONGO_WEBHOOK_SECRET).",
    );
  }
  if (!header) throw new PaymentHttpError(400, "Missing Paymongo-Signature header");
  const { t, te, li } = parsePaymongoSignatureHeader(header);
  if (!t) throw new PaymentHttpError(400, "Invalid Paymongo-Signature header");

  let payload: { data?: { attributes?: { livemode?: boolean } } };
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as typeof payload;
  } catch {
    throw new PaymentHttpError(400, "Invalid JSON body");
  }
  const livemode = Boolean(payload.data?.attributes?.livemode);
  const expected = livemode ? li : te;
  if (!expected) throw new PaymentHttpError(400, "Missing signature fragment for this mode");

  const signed = `${t}.${rawBody.toString("utf8")}`;
  const digest = createHmac("sha256", secret).update(signed, "utf8").digest("hex");
  if (!timingSafeEqualAscii(digest, expected)) {
    throw new PaymentHttpError(400, "Invalid Paymongo-Signature");
  }
}

/**
 * Handle verified webhook JSON. Only `payment.paid` creates donations.
 * Body shape: data.attributes.type, data.attributes.data = payment resource.
 */
export async function dispatchFromJson(body: unknown): Promise<void> {
  const root = body as {
    data?: {
      attributes?: {
        type?: string;
        livemode?: boolean;
        data?: { attributes?: Record<string, unknown> };
      };
    };
  };
  const eventType = root.data?.attributes?.type;
  if (eventType !== "payment.paid") return;

  const payAttrs = root.data?.attributes?.data?.attributes;
  if (!payAttrs || typeof payAttrs !== "object") return;

  const piId = payAttrs.payment_intent_id;
  const paidAtRaw = payAttrs.paid_at;
  if (typeof piId !== "string" || !piId) {
    console.warn("payment.paid without payment_intent_id; skipping");
    return;
  }

  const paidAtSec = typeof paidAtRaw === "number" ? paidAtRaw : Math.floor(Date.now() / 1000);

  await recordDonationIfSucceededIntent({
    paymentIntentId: piId,
    paidAt: new Date(paidAtSec * 1000),
  });
}

/**
 * `created` — new Donation row inserted.
 * `exists` — donation already linked to this PI (e.g. webhook won the race).
 * `skipped` — PI not succeeded yet, or campaign/metadata blocked recording.
 */
export async function recordDonationIfSucceededIntent(opts: {
  paymentIntentId: string;
  paidAt?: Date;
}): Promise<"created" | "exists" | "skipped"> {
  const { paymentIntentId, paidAt } = opts;

  const existing = await prisma.donation.findFirst({
    where: { paymongoPaymentIntentId: paymentIntentId },
  });
  if (existing) return "exists";

  let attrs: PaymongoPaymentIntentAttrs;
  try {
    const row = await retrievePaymentIntent(paymentIntentId);
    attrs = row.attributes;
  } catch (e) {
    console.error(`Could not retrieve PayMongo PI ${paymentIntentId}: ${String(e)}`);
    return "skipped";
  }
  if (attrs.status !== "succeeded") {
    console.warn(`PayMongo PI ${paymentIntentId} status=${attrs.status}; not recording`);
    return "skipped";
  }

  const amountPhp = attrs.amount / 100;
  if (!Number.isFinite(amountPhp) || amountPhp <= 0) return "skipped";

  const slug = attrs.metadata?.campaign_slug?.trim();
  if (!slug) {
    console.error(`PayMongo PI ${paymentIntentId} missing campaign_slug metadata`);
    return "skipped";
  }
  const donorName = (attrs.metadata?.donor_display_name || "Supporter").trim().slice(0, 120);
  const hideAmountPublic = parseHideAmountPublicMetadata(attrs.metadata?.hide_amount_public);

  const createdAt = paidAt ?? new Date();

  const campaign = await prisma.campaign.findUnique({ where: { slug } });
  if (!campaign) {
    console.error(`Campaign not found for slug ${slug} (PayMongo ${paymentIntentId})`);
    return "skipped";
  }
  const visible =
    campaign.approvalStatus === CampaignApprovalStatus.APPROVED &&
    (campaign.lifecycleStatus === CampaignLifecycleStatus.PUBLISHED ||
      campaign.lifecycleStatus === CampaignLifecycleStatus.DONE);
  if (!visible) {
    console.warn(
      `Campaign ${slug} not accepting donations; skipping PayMongo ${paymentIntentId}`,
    );
    return "skipped";
  }

  try {
    await prisma.donation.create({
      data: {
        campaignId: campaign.id,
        donorDisplayName: donorName,
        amount: amountPhp,
        paymongoPaymentIntentId: paymentIntentId,
        trackingNumber: "paymongo",
        branch: attrs.metadata?.donation_channel === "card" ? "card" : "qrph",
        fundraisingReference: paymentIntentId,
        verificationStatus: DonationVerificationStatus.VERIFIED,
        hideAmountPublic,
        createdAt,
      },
    });
  } catch (e) {
    if (isPrismaUniqueConflict(e)) {
      console.log(`PayMongo donation already present for ${paymentIntentId}`);
      return "exists";
    }
    throw e;
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { raisedAmount: { increment: amountPhp } },
  });
  console.log(`Recorded PayMongo donation ${paymentIntentId} campaign ${slug}`);
  return "created";
}
