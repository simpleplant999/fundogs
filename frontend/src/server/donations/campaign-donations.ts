import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  DonationVerificationStatus,
  type Campaign,
} from "@prisma/client";
import { prisma } from "../db";
import { CampaignHttpError } from "../campaigns/service";
import { mapDonation, type ApiDonor } from "../mappers";
import * as stripe from "../payments/stripe";
import * as stripeWebhook from "../payments/stripe-webhook";
import * as paymongo from "../payments/paymongo";
import { recordDonationIfSucceededIntent } from "../payments/paymongo-webhook";

function isPublicVisible(c: Campaign): boolean {
  return (
    c.approvalStatus === CampaignApprovalStatus.APPROVED &&
    (c.lifecycleStatus === CampaignLifecycleStatus.PUBLISHED ||
      c.lifecycleStatus === CampaignLifecycleStatus.DONE)
  );
}

async function getCampaignRowBySlug(slug: string): Promise<Campaign> {
  const c = await prisma.campaign.findUnique({ where: { slug } });
  if (!c) throw new CampaignHttpError(404, `Campaign not found: ${slug}`);
  return c;
}

function requireAcceptingDonations(c: Campaign): void {
  if (!isPublicVisible(c)) {
    throw new CampaignHttpError(
      400,
      "Donations are only accepted on approved, published campaigns.",
    );
  }
}

export async function createDonationCheckoutSession(
  slug: string,
  dto: { donorDisplayName: string; amount: number; hideAmount?: boolean },
): Promise<{ url: string }> {
  const c = await getCampaignRowBySlug(slug);
  requireAcceptingDonations(c);
  const url = await stripe.createDonationCheckoutSession({
    campaignSlug: c.slug,
    campaignTitle: c.title,
    donorDisplayName: dto.donorDisplayName.trim(),
    amountPhp: dto.amount,
    hideAmountPublic: dto.hideAmount === true,
  });
  return { url };
}

export async function createDonationPaymentIntent(
  slug: string,
  dto: { donorDisplayName: string; amount: number; hideAmount?: boolean },
): Promise<{ clientSecret: string }> {
  const c = await getCampaignRowBySlug(slug);
  requireAcceptingDonations(c);
  return stripe.createDonationPaymentIntent({
    campaignSlug: c.slug,
    campaignTitle: c.title,
    donorDisplayName: dto.donorDisplayName.trim(),
    amountPhp: dto.amount,
    hideAmountPublic: dto.hideAmount === true,
  });
}

/** Record a paid Checkout session when Stripe webhooks did not run (e.g. local dev). Idempotent. */
export async function syncDonationStripeCheckout(
  slug: string,
  sessionId: string,
): Promise<{ ok: true }> {
  let session: Awaited<ReturnType<typeof stripe.retrieveCheckoutSession>>;
  try {
    session = await stripe.retrieveCheckoutSession(sessionId);
  } catch {
    throw new CampaignHttpError(400, "Could not retrieve Stripe checkout session.");
  }
  const metaSlug = session.metadata?.campaign_slug?.trim();
  if (!metaSlug || metaSlug !== slug) {
    throw new CampaignHttpError(400, "This checkout session does not belong to this campaign.");
  }
  await stripeWebhook.recordCheckoutFromRetrievedSession(session);
  return { ok: true };
}

/** Record a succeeded PaymentIntent when webhooks did not run (e.g. 3DS return). Idempotent. */
export async function syncDonationStripePaymentIntent(
  slug: string,
  paymentIntentId: string,
): Promise<{ ok: true }> {
  let pi: Awaited<ReturnType<typeof stripe.retrievePaymentIntent>>;
  try {
    pi = await stripe.retrievePaymentIntent(paymentIntentId);
  } catch {
    throw new CampaignHttpError(400, "Could not retrieve Stripe payment.");
  }
  const metaSlug = pi.metadata?.campaign_slug?.trim();
  if (!metaSlug || metaSlug !== slug) {
    throw new CampaignHttpError(400, "This payment does not belong to this campaign.");
  }
  await stripeWebhook.recordPaymentIntentFromRetrieved(pi);
  return { ok: true };
}

export async function createPaymongoQrDonation(
  slug: string,
  dto: {
    donorDisplayName: string;
    amount: number;
    billingEmail?: string;
    billingPhone?: string;
    hideAmount?: boolean;
  },
): Promise<{ paymentIntentId: string; clientKey: string; qrImageUrl: string }> {
  const c = await getCampaignRowBySlug(slug);
  requireAcceptingDonations(c);
  const email =
    dto.billingEmail?.trim() ||
    `donors+${encodeURIComponent(c.slug).slice(0, 48)}@example.com`;
  const phone = (dto.billingPhone?.replace(/\s+/g, "") || "09171234567").slice(0, 20);
  return paymongo.createQrDonation({
    amountPhp: dto.amount,
    campaignSlug: c.slug,
    campaignTitle: c.title,
    donorDisplayName: dto.donorDisplayName.trim(),
    billingEmail: email,
    billingPhone: phone,
    hideAmountPublic: dto.hideAmount === true,
  });
}

/** Test-mode card: PaymentIntent only; browser attaches PM with `pk_test_` + `client_key`. */
export async function createPaymongoCardDonation(
  slug: string,
  dto: {
    donorDisplayName: string;
    amount: number;
    billingEmail?: string;
    billingPhone?: string;
    hideAmount?: boolean;
  },
): Promise<{ paymentIntentId: string; clientKey: string }> {
  const c = await getCampaignRowBySlug(slug);
  requireAcceptingDonations(c);
  return paymongo.createCardDonationIntent({
    amountPhp: dto.amount,
    campaignSlug: c.slug,
    campaignTitle: c.title,
    donorDisplayName: dto.donorDisplayName.trim(),
    hideAmountPublic: dto.hideAmount === true,
  });
}

/** Poll from the client after QR scan; records when PayMongo marks the intent succeeded. */
export async function syncPaymongoDonation(
  slug: string,
  paymentIntentId: string,
): Promise<{ recorded: boolean; alreadyRecorded: boolean; status: string }> {
  let row: Awaited<ReturnType<typeof paymongo.retrievePaymentIntent>>;
  try {
    row = await paymongo.retrievePaymentIntent(paymentIntentId);
  } catch {
    throw new CampaignHttpError(400, "Could not retrieve PayMongo payment intent.");
  }
  const metaSlug = row.attributes.metadata?.campaign_slug?.trim();
  if (!metaSlug || metaSlug !== slug) {
    throw new CampaignHttpError(400, "This payment does not belong to this campaign.");
  }
  const outcome = await recordDonationIfSucceededIntent({
    paymentIntentId: row.id,
  });
  return {
    status: row.attributes.status,
    recorded: outcome === "created",
    alreadyRecorded: outcome === "exists",
  };
}

export async function addDonation(
  slug: string,
  dto: {
    donorDisplayName: string;
    amount: number;
    trackingNumber: string;
    branch: string;
    fundraisingReference: string;
    hideAmount?: boolean;
  },
): Promise<ApiDonor> {
  const c = await getCampaignRowBySlug(slug);
  requireAcceptingDonations(c);
  const d = await prisma.donation.create({
    data: {
      campaignId: c.id,
      donorDisplayName: dto.donorDisplayName.trim(),
      amount: dto.amount,
      trackingNumber: dto.trackingNumber,
      branch: dto.branch,
      fundraisingReference: dto.fundraisingReference,
      verificationStatus: DonationVerificationStatus.PENDING,
      hideAmountPublic: dto.hideAmount === true,
    },
  });
  return mapDonation(d);
}
