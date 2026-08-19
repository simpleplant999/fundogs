import { PaymentHttpError } from "@/server/payments/errors";
import { dispatchFromJson, verifySignature } from "@/server/payments/paymongo-webhook";
import { jsonError, jsonOk } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("paymongo-signature") ?? undefined;
  const raw = Buffer.from(await request.arrayBuffer());
  if (!raw.length) return jsonError("Missing raw body", 400);

  try {
    verifySignature(raw, signature);
    let json: unknown;
    try {
      json = JSON.parse(raw.toString("utf8"));
    } catch {
      return jsonError("Invalid JSON body", 400);
    }
    await dispatchFromJson(json);
    return jsonOk({ received: true });
  } catch (e) {
    if (e instanceof PaymentHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Webhook error", 500);
  }
}
