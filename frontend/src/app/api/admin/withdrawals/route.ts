import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import { listAdminWithdrawals, WithdrawalHttpError } from "@/server/withdrawals/service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  try {
    return jsonOk(await listAdminWithdrawals());
  } catch (e) {
    if (e instanceof WithdrawalHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
