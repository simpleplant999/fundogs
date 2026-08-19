import { CampaignHttpError } from "@/server/campaigns/service";
import { coerceHideAmount } from "@/server/donations/hide-amount";
import { addDonation } from "@/server/donations/campaign-donations";
import { PaymentHttpError } from "@/server/payments/errors";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const body = await readJsonBody<{
    donorDisplayName?: string;
    amount?: number;
    trackingNumber?: string;
    branch?: string;
    fundraisingReference?: string;
    hideAmount?: unknown;
  }>(request);
  if (!body?.donorDisplayName?.trim()) {
    return jsonError("donorDisplayName is required", 400);
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 1) {
    return jsonError("amount must be at least 1", 400);
  }
  if (typeof body.trackingNumber !== "string") {
    return jsonError("trackingNumber is required", 400);
  }
  if (typeof body.branch !== "string") {
    return jsonError("branch is required", 400);
  }
  if (typeof body.fundraisingReference !== "string") {
    return jsonError("fundraisingReference is required", 400);
  }
  try {
    return jsonOk(
      await addDonation(slug, {
        donorDisplayName: body.donorDisplayName,
        amount,
        trackingNumber: body.trackingNumber,
        branch: body.branch,
        fundraisingReference: body.fundraisingReference,
        hideAmount: coerceHideAmount(body.hideAmount),
      }),
    );
  } catch (e) {
    if (e instanceof CampaignHttpError || e instanceof PaymentHttpError) {
      return jsonError(e.message, e.status);
    }
    console.error(e);
    return jsonError("Failed to add donation", 500);
  }
}
