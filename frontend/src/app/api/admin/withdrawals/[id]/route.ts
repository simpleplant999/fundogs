import { WithdrawalRequestStatus } from "@prisma/client";
import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import { updateAdminWithdrawal, WithdrawalHttpError } from "@/server/withdrawals/service";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await context.params;
  const body = await readJsonBody<{
    status?: WithdrawalRequestStatus;
    adminNote?: string;
  }>(request);
  if (!body?.status) return jsonError("status is required", 400);
  try {
    return jsonOk(
      await updateAdminWithdrawal(id, {
        status: body.status,
        adminNote: body.adminNote,
      }),
    );
  } catch (e) {
    if (e instanceof WithdrawalHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
