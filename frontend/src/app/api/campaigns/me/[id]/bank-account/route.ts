import { requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";
import {
  WithdrawalHttpError,
  getCreatorBankAccount,
  upsertCreatorBankAccount,
} from "@/server/withdrawals/service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  try {
    return jsonOk(await getCreatorBankAccount(user.sub, id));
  } catch (e) {
    if (e instanceof WithdrawalHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to load bank account", 500);
  }
}

export async function PATCH(request: Request, context: Ctx) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = await readJsonBody<{
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
  }>(request);
  if (
    !body?.accountHolderName?.trim() ||
    !body?.bankName?.trim() ||
    !body?.accountNumber?.trim()
  ) {
    return jsonError("accountHolderName, bankName, and accountNumber are required", 400);
  }
  try {
    return jsonOk(
      await upsertCreatorBankAccount(user.sub, id, {
        accountHolderName: body.accountHolderName,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
      }),
    );
  } catch (e) {
    if (e instanceof WithdrawalHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to save bank account", 500);
  }
}
