import { CampaignHttpError } from "@/server/campaigns/service";
import { coerceHideAmount } from "@/server/donations/hide-amount";
import { createDonationCheckoutSession } from "@/server/donations/campaign-donations";
import { PaymentHttpError } from "@/server/payments/errors";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const body = await readJsonBody<{
    donorDisplayName?: string;
    amount?: number;
    hideAmount?: unknown;
  }>(request);
  if (!body?.donorDisplayName?.trim()) {
    return jsonError("donorDisplayName is required", 400);
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 5_000_000) {
    return jsonError("amount must be between 1 and 5000000", 400);
  }
  try {
    return jsonOk(
      await createDonationCheckoutSession(slug, {
        donorDisplayName: body.donorDisplayName,
        amount,
        hideAmount: coerceHideAmount(body.hideAmount),
      }),
    );
  } catch (e) {
    if (e instanceof CampaignHttpError || e instanceof PaymentHttpError) {
      return jsonError(e.message, e.status);
    }
    console.error(e);
    return jsonError("Failed to create checkout session", 500);
  }
}
