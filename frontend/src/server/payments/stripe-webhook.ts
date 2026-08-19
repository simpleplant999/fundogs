import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  DonationVerificationStatus,
} from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "../db";
import { parseHideAmountPublicMetadata } from "../donations/hide-amount";

export async function dispatchVerifiedEvent(event: Stripe.Event): Promise<void> {
  console.log(`Stripe webhook received: ${event.type}`);
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, event.created);
      break;
    case "checkout.session.async_payment_succeeded":
      await onCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, event.created);
      break;
    case "payment_intent.succeeded":
      await onPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, event.created);
      break;
    default:
      break;
  }
}

async function onPaymentIntentSucceeded(
  pi: Stripe.PaymentIntent,
  eventCreatedSec: number,
): Promise<void> {
  if (pi.status !== "succeeded") return;
  const slug = pi.metadata?.campaign_slug?.trim();
  if (!slug) {
    console.error(`payment_intent.succeeded missing campaign_slug: ${pi.id}`);
    return;
  }
  const donorName = (pi.metadata?.donor_display_name || "Supporter").trim().slice(0, 120);
  const hideAmountPublic = parseHideAmountPublicMetadata(pi.metadata?.hide_amount_public);
  if (pi.amount == null) return;
  const amountPhp = pi.amount / 100;

  const existing = await prisma.donation.findFirst({
    where: { stripePaymentIntentId: pi.id },
  });
  if (existing) return;

  const existingByFundraisingRef = await prisma.donation.findFirst({
    where: { fundraisingReference: pi.id },
  });
  if (existingByFundraisingRef) return;

  const campaign = await prisma.campaign.findUnique({ where: { slug } });
  if (!campaign) {
    console.error(`Campaign not found for slug ${slug} (pi ${pi.id})`);
    return;
  }
  const visible =
    campaign.approvalStatus === CampaignApprovalStatus.APPROVED &&
    (campaign.lifecycleStatus === CampaignLifecycleStatus.PUBLISHED ||
      campaign.lifecycleStatus === CampaignLifecycleStatus.DONE);
  if (!visible) {
    console.warn(`Campaign ${slug} not accepting donations; skipping pi ${pi.id}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const dup = await tx.donation.findFirst({ where: { stripePaymentIntentId: pi.id } });
    if (dup) return;
    await tx.donation.create({
      data: {
        campaignId: campaign.id,
        donorDisplayName: donorName,
        amount: amountPhp,
        stripePaymentIntentId: pi.id,
        trackingNumber: "stripe",
        branch: "stripe-element",
        fundraisingReference: pi.id,
        verificationStatus: DonationVerificationStatus.VERIFIED,
        hideAmountPublic,
        createdAt: new Date(eventCreatedSec * 1000),
      },
    });
    await tx.campaign.update({
      where: { id: campaign.id },
      data: { raisedAmount: { increment: amountPhp } },
    });
  });
  console.log(`Recorded PaymentIntent donation ${pi.id} campaign ${slug}`);
}

async function onCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  eventCreatedSec: number,
): Promise<void> {
  if (session.payment_status !== "paid") {
    console.warn(`Ignoring checkout session ${session.id} with status ${session.payment_status}`);
    return;
  }
  const slug = session.metadata?.campaign_slug?.trim();
  if (!slug) {
    console.error(`checkout.session.completed missing campaign_slug: ${session.id}`);
    return;
  }
  const donorName = (session.metadata?.donor_display_name || "Supporter").trim().slice(0, 120);
  const hideFromSession = parseHideAmountPublicMetadata(session.metadata?.hide_amount_public);
  const expandedPi = session.payment_intent;
  const hideFromPi =
    typeof expandedPi === "object" &&
    expandedPi &&
    "metadata" in expandedPi &&
    !("deleted" in expandedPi)
      ? parseHideAmountPublicMetadata(
          (expandedPi as Stripe.PaymentIntent).metadata?.hide_amount_public,
        )
      : false;
  const hideAmountPublic = hideFromSession || hideFromPi;
  const amountTotal = session.amount_total;
  if (amountTotal == null) {
    console.error(`checkout.session.completed missing amount_total: ${session.id}`);
    return;
  }
  const amountPhp = amountTotal / 100;

  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? "");

  const existing = await prisma.donation.findFirst({
    where: { stripeCheckoutSessionId: session.id },
  });
  if (existing) return;

  if (piId) {
    const wonByPi = await prisma.donation.findFirst({
      where: { stripePaymentIntentId: piId },
    });
    if (wonByPi) {
      if (!wonByPi.stripeCheckoutSessionId) {
        await prisma.donation.update({
          where: { id: wonByPi.id },
          data: { stripeCheckoutSessionId: session.id },
        });
        console.log(
          `Linked checkout session ${session.id} to existing donation ${wonByPi.id} (PI ${piId})`,
        );
      }
      return;
    }
  }

  const campaign = await prisma.campaign.findUnique({ where: { slug } });
  if (!campaign) {
    console.error(`Campaign not found for slug ${slug} (session ${session.id})`);
    return;
  }
  const visible =
    campaign.approvalStatus === CampaignApprovalStatus.APPROVED &&
    (campaign.lifecycleStatus === CampaignLifecycleStatus.PUBLISHED ||
      campaign.lifecycleStatus === CampaignLifecycleStatus.DONE);
  if (!visible) {
    console.warn(`Campaign ${slug} not accepting donations; skipping session ${session.id}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const dup = await tx.donation.findFirst({ where: { stripeCheckoutSessionId: session.id } });
    if (dup) return;
    await tx.donation.create({
      data: {
        campaignId: campaign.id,
        donorDisplayName: donorName,
        amount: amountPhp,
        stripeCheckoutSessionId: session.id,
        ...(piId ? { stripePaymentIntentId: piId } : {}),
        trackingNumber: "stripe",
        branch: "stripe",
        fundraisingReference: piId || session.id,
        verificationStatus: DonationVerificationStatus.VERIFIED,
        hideAmountPublic,
        createdAt: new Date(eventCreatedSec * 1000),
      },
    });
    await tx.campaign.update({
      where: { id: campaign.id },
      data: { raisedAmount: { increment: amountPhp } },
    });
  });
  console.log(`Recorded checkout donation for session ${session.id} campaign ${slug}`);
}

/** When webhooks cannot reach your server (common in local dev), call after retrieving the session from Stripe. */
export async function recordCheckoutFromRetrievedSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const createdSec =
    typeof session.created === "number" ? session.created : Math.floor(Date.now() / 1000);
  await onCheckoutSessionCompleted(session, createdSec);
}

/** Same for Payment Element / 3DS return when webhooks are missing. */
export async function recordPaymentIntentFromRetrieved(pi: Stripe.PaymentIntent): Promise<void> {
  const createdSec = typeof pi.created === "number" ? pi.created : Math.floor(Date.now() / 1000);
  await onPaymentIntentSucceeded(pi, createdSec);
}
