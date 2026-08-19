import { OrganizationMemberRole, UserRole } from "@prisma/client";
import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import { AdminHttpError, updateUser } from "@/server/admin/service";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await context.params;
  const body = await readJsonBody<{
    role?: UserRole;
    organizationId?: string | null;
    organizationMemberRole?: OrganizationMemberRole;
  }>(request);
  try {
    return jsonOk(
      await updateUser(id, {
        role: body?.role,
        organizationId: body?.organizationId,
        organizationMemberRole: body?.organizationMemberRole,
      }),
    );
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
