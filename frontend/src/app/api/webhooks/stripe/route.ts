import { PaymentHttpError } from "@/server/payments/errors";
import { constructWebhookEvent } from "@/server/payments/stripe";
import { dispatchVerifiedEvent } from "@/server/payments/stripe-webhook";
import { jsonError, jsonOk } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature") ?? undefined;
  if (!signature) return jsonError("Missing Stripe-Signature header", 400);

  const raw = Buffer.from(await request.arrayBuffer());
  if (!raw.length) return jsonError("Missing raw body", 400);

  try {
    const event = constructWebhookEvent(raw, signature);
    await dispatchVerifiedEvent(event);
    return jsonOk({ received: true });
  } catch (e) {
    if (e instanceof PaymentHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError(e instanceof Error ? e.message : "Webhook error", 400);
  }
}
