import { CampaignHttpError } from "@/server/campaigns/service";
import { syncDonationStripeCheckout } from "@/server/donations/campaign-donations";
import { PaymentHttpError } from "@/server/payments/errors";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const body = await readJsonBody<{ sessionId?: string }>(request);
  if (!body?.sessionId || body.sessionId.length < 10) {
    return jsonError("sessionId is required", 400);
  }
  try {
    return jsonOk(await syncDonationStripeCheckout(slug, body.sessionId));
  } catch (e) {
    if (e instanceof CampaignHttpError || e instanceof PaymentHttpError) {
      return jsonError(e.message, e.status);
    }
    console.error(e);
    return jsonError("Failed to sync checkout", 500);
  }
}
