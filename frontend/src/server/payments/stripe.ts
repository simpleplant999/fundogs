import Stripe from "stripe";
import { hideAmountPublicMetadataValue } from "../donations/hide-amount";
import { PaymentHttpError } from "./errors";

let client: Stripe | null = null;

function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      throw new PaymentHttpError(
        503,
        "Online card donations are not configured (missing STRIPE_SECRET_KEY).",
      );
    }
    client = new Stripe(key, { typescript: true });
  }
  return client;
}

/** First origin in FRONTEND_ORIGIN / NEXT_PUBLIC_SITE_URL (comma-separated allowed). */
export function publicFrontendBaseUrl(): string {
  const raw =
    process.env.FRONTEND_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  return raw.split(",")[0].trim().replace(/\/+$/, "");
}

export async function createDonationCheckoutSession(opts: {
  campaignSlug: string;
  campaignTitle: string;
  donorDisplayName: string;
  amountPhp: number;
  hideAmountPublic?: boolean;
}): Promise<string> {
  const frontend = publicFrontendBaseUrl();
  const slugEnc = encodeURIComponent(opts.campaignSlug);
  const unitAmount = Math.round(opts.amountPhp * 100);
  if (!Number.isFinite(unitAmount) || unitAmount < 1) {
    throw new PaymentHttpError(500, "Invalid amount for Stripe");
  }
  const hideMeta = hideAmountPublicMetadataValue(opts.hideAmountPublic);
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "php",
          unit_amount: unitAmount,
          product_data: {
            name: `Donation — ${opts.campaignTitle}`.slice(0, 120),
          },
        },
      },
    ],
    metadata: {
      campaign_slug: opts.campaignSlug,
      donor_display_name: opts.donorDisplayName.slice(0, 200),
      hide_amount_public: hideMeta,
    },
    /** Session metadata is NOT copied onto the PaymentIntent — webhooks often only receive `payment_intent.succeeded`. */
    payment_intent_data: {
      metadata: {
        campaign_slug: opts.campaignSlug,
        donor_display_name: opts.donorDisplayName.slice(0, 200),
        hide_amount_public: hideMeta,
      },
    },
    success_url: `${frontend}/campaigns/${slugEnc}?donated=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontend}/campaigns/${slugEnc}?donated=cancel`,
  });
  if (!session.url) {
    throw new PaymentHttpError(500, "Stripe did not return a checkout URL");
  }
  return session.url;
}

export async function createDonationPaymentIntent(opts: {
  campaignSlug: string;
  campaignTitle: string;
  donorDisplayName: string;
  amountPhp: number;
  hideAmountPublic?: boolean;
}): Promise<{ clientSecret: string }> {
  const unitAmount = Math.round(opts.amountPhp * 100);
  if (!Number.isFinite(unitAmount) || unitAmount < 1) {
    throw new PaymentHttpError(500, "Invalid amount for Stripe");
  }
  const hideMeta = hideAmountPublicMetadataValue(opts.hideAmountPublic);
  const pi = await getStripe().paymentIntents.create({
    amount: unitAmount,
    currency: "php",
    automatic_payment_methods: { enabled: true },
    metadata: {
      campaign_slug: opts.campaignSlug,
      donor_display_name: opts.donorDisplayName.slice(0, 200),
      hide_amount_public: hideMeta,
    },
    description: `Donation — ${opts.campaignTitle}`.slice(0, 500),
  });
  if (!pi.client_secret) {
    throw new PaymentHttpError(500, "Stripe did not return a client secret");
  }
  return { clientSecret: pi.client_secret };
}

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
}

export async function retrievePaymentIntent(
  paymentIntentId: string,
): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new PaymentHttpError(
      503,
      "Stripe webhooks are not configured (missing STRIPE_WEBHOOK_SECRET).",
    );
  }
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}
