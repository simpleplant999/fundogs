import { syncPaymongoDonation } from "@/server/donations/support";
import { PaymentHttpError } from "@/server/payments/errors";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJsonBody<{ paymentIntentId?: string }>(request);
  if (!body?.paymentIntentId || body.paymentIntentId.length < 5) {
    return jsonError("paymentIntentId is required", 400);
  }
  try {
    return jsonOk(await syncPaymongoDonation(body.paymentIntentId));
  } catch (e) {
    if (e instanceof PaymentHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to sync support PayMongo donation", 500);
  }
}
