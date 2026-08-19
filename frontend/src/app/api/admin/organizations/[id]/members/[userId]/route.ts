import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import { AdminHttpError, removeOrganizationMember } from "@/server/admin/service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(request: Request, context: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id, userId } = await context.params;
  try {
    return jsonOk(await removeOrganizationMember(id, userId));
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
