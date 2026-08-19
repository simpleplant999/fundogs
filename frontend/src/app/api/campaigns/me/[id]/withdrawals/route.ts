import { requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";
import {
  WithdrawalHttpError,
  createCreatorWithdrawal,
  listCreatorWithdrawals,
} from "@/server/withdrawals/service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  try {
    return jsonOk(await listCreatorWithdrawals(user.sub, id));
  } catch (e) {
    if (e instanceof WithdrawalHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to load withdrawals", 500);
  }
}

export async function POST(request: Request, context: Ctx) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = await readJsonBody<{ amount?: number }>(request);
  if (body?.amount == null) return jsonError("amount is required", 400);
  try {
    return jsonOk(await createCreatorWithdrawal(user.sub, id, { amount: Number(body.amount) }));
  } catch (e) {
    if (e instanceof WithdrawalHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to create withdrawal", 500);
  }
}
