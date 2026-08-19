import { coerceHideAmount } from "@/server/donations/hide-amount";
import { createPaymongoCardDonation } from "@/server/donations/support";
import { PaymentHttpError } from "@/server/payments/errors";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJsonBody<{
    donorDisplayName?: string;
    amount?: number;
    hideAmount?: unknown;
  }>(request);
  if (!body?.donorDisplayName?.trim()) {
    return jsonError("donorDisplayName is required", 400);
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 20 || amount > 5_000_000) {
    return jsonError("amount must be between 20 and 5000000", 400);
  }
  try {
    return jsonOk(
      await createPaymongoCardDonation({
        donorDisplayName: body.donorDisplayName,
        amount,
        hideAmount: coerceHideAmount(body.hideAmount),
      }),
    );
  } catch (e) {
    if (e instanceof PaymentHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to create support PayMongo card donation", 500);
  }
}
