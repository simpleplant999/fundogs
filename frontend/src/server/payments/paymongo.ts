import { hideAmountPublicMetadataValue } from "../donations/hide-amount";
import { PaymentHttpError } from "./errors";

const PAYMONGO_API = "https://api.paymongo.com/v1";

export type PaymongoPaymentIntentAttrs = {
  amount: number;
  currency: string;
  status: string;
  client_key?: string;
  metadata?: Record<string, string>;
  next_action?: {
    type?: string;
    code?: { image_url?: string; id?: string; label?: string; amount?: number };
  };
};

function unwrapData<T = Record<string, unknown>>(json: unknown): { id: string; attributes: T } {
  const root = json as { data?: { id?: string; attributes?: T } };
  const id = root.data?.id;
  const attributes = root.data?.attributes;
  if (!id || attributes == null) {
    throw new PaymentHttpError(500, "Unexpected PayMongo response shape");
  }
  return { id, attributes };
}

function paymongoErrorMessage(json: unknown): string {
  const err = json as { errors?: Array<{ detail?: string }> };
  const d = err.errors?.[0]?.detail;
  return typeof d === "string" ? d : "PayMongo request failed";
}

function secretKey(): string {
  const sk = process.env.PAYMONGO_SECRET_KEY?.trim();
  if (!sk) {
    throw new PaymentHttpError(503, "PayMongo is not configured (missing PAYMONGO_SECRET_KEY).");
  }
  return sk;
}

function authHeader(): string {
  const sk = secretKey();
  return `Basic ${Buffer.from(`${sk}:`).toString("base64")}`;
}

async function request(method: "GET" | "POST", path: string, body?: object): Promise<unknown> {
  const res = await fetch(`${PAYMONGO_API}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    throw new PaymentHttpError(400, paymongoErrorMessage(json));
  }
  return json;
}

/** Amount in PayMongo units (1.00 PHP = 100). Minimum 2000 (= PHP 20). */
export function amountToPaymongoUnits(amountPhp: number): number {
  return Math.round(amountPhp * 100);
}

export async function createQrDonation(opts: {
  amountPhp: number;
  campaignSlug: string;
  campaignTitle: string;
  donorDisplayName: string;
  billingEmail: string;
  billingPhone: string;
  hideAmountPublic?: boolean;
}): Promise<{ paymentIntentId: string; clientKey: string; qrImageUrl: string }> {
  const units = amountToPaymongoUnits(opts.amountPhp);
  if (!Number.isFinite(units) || units < 2000) {
    throw new PaymentHttpError(400, "PayMongo QR requires at least PHP 20.");
  }
  const desc = `Donation — ${opts.campaignTitle}`.slice(0, 250);
  const meta = {
    campaign_slug: opts.campaignSlug,
    donor_display_name: opts.donorDisplayName.slice(0, 200),
    donation_channel: "qrph",
    hide_amount_public: hideAmountPublicMetadataValue(opts.hideAmountPublic),
  };

  const piJson = await request("POST", "/payment_intents", {
    data: {
      attributes: {
        amount: units,
        currency: "PHP",
        payment_method_allowed: ["qrph"],
        description: desc,
        metadata: meta,
      },
    },
  });
  const pi = unwrapData<PaymongoPaymentIntentAttrs>(piJson);
  const clientKey = pi.attributes.client_key;
  if (!clientKey) {
    throw new PaymentHttpError(500, "PayMongo did not return client_key on payment intent");
  }

  const pmJson = await request("POST", "/payment_methods", {
    data: {
      attributes: {
        type: "qrph",
        billing: {
          name: opts.donorDisplayName.slice(0, 120),
          email: opts.billingEmail.trim().slice(0, 120),
          phone: opts.billingPhone.trim().slice(0, 32),
          address: {
            line1: "Fundogs donor",
            city: "Manila",
            state: "Metro Manila",
            postal_code: "1000",
            country: "PH",
          },
        },
        expiry_seconds: 1800,
      },
    },
  });
  const pm = unwrapData(pmJson);

  const attachJson = await request("POST", `/payment_intents/${pi.id}/attach`, {
    data: {
      attributes: {
        payment_method: pm.id,
      },
    },
  });
  const attached = unwrapData<PaymongoPaymentIntentAttrs>(attachJson);
  const imageUrl = attached.attributes.next_action?.code?.image_url;
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new PaymentHttpError(500, "PayMongo did not return a QR image URL after attach");
  }
  return {
    paymentIntentId: pi.id,
    clientKey,
    qrImageUrl: imageUrl,
  };
}

/** Card-only intent for test keys (`pk_test_` + PayMongo test cards). Client creates PM and attaches with `client_key`. */
export async function createCardDonationIntent(opts: {
  amountPhp: number;
  campaignSlug: string;
  campaignTitle: string;
  donorDisplayName: string;
  hideAmountPublic?: boolean;
}): Promise<{ paymentIntentId: string; clientKey: string }> {
  const sk = secretKey();
  if (!sk.startsWith("sk_test_")) {
    throw new PaymentHttpError(
      400,
      "PayMongo card test flow is only available with a test secret key (sk_test_).",
    );
  }
  const units = amountToPaymongoUnits(opts.amountPhp);
  if (!Number.isFinite(units) || units < 2000) {
    throw new PaymentHttpError(400, "PayMongo card requires at least PHP 20.");
  }
  const desc = `Donation — ${opts.campaignTitle}`.slice(0, 250);
  const meta = {
    campaign_slug: opts.campaignSlug,
    donor_display_name: opts.donorDisplayName.slice(0, 200),
    donation_channel: "card",
    hide_amount_public: hideAmountPublicMetadataValue(opts.hideAmountPublic),
  };

  const piJson = await request("POST", "/payment_intents", {
    data: {
      attributes: {
        amount: units,
        currency: "PHP",
        payment_method_allowed: ["card"],
        description: desc,
        metadata: meta,
      },
    },
  });
  const pi = unwrapData<PaymongoPaymentIntentAttrs>(piJson);
  const clientKey = pi.attributes.client_key;
  if (!clientKey) {
    throw new PaymentHttpError(500, "PayMongo did not return client_key on payment intent");
  }
  return {
    paymentIntentId: pi.id,
    clientKey,
  };
}

export async function retrievePaymentIntent(
  paymentIntentId: string,
): Promise<{ id: string; attributes: PaymongoPaymentIntentAttrs }> {
  const json = await request("GET", `/payment_intents/${encodeURIComponent(paymentIntentId)}`);
  return unwrapData<PaymongoPaymentIntentAttrs>(json);
}
