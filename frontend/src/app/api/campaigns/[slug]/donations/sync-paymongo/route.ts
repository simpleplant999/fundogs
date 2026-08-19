import { CampaignHttpError } from "@/server/campaigns/service";
import { syncPaymongoDonation } from "@/server/donations/campaign-donations";
import { PaymentHttpError } from "@/server/payments/errors";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const body = await readJsonBody<{ paymentIntentId?: string }>(request);
  if (!body?.paymentIntentId || body.paymentIntentId.length < 5) {
    return jsonError("paymentIntentId is required", 400);
  }
  try {
    return jsonOk(await syncPaymongoDonation(slug, body.paymentIntentId));
  } catch (e) {
    if (e instanceof CampaignHttpError || e instanceof PaymentHttpError) {
      return jsonError(e.message, e.status);
    }
    console.error(e);
    return jsonError("Failed to sync PayMongo donation", 500);
  }
}
