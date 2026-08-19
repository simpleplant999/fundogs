import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import {
  getAdminCampaignBankAccount,
  WithdrawalHttpError,
} from "@/server/withdrawals/service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await context.params;
  try {
    return jsonOk(await getAdminCampaignBankAccount(id));
  } catch (e) {
    if (e instanceof WithdrawalHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
