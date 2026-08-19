import { OrganizationMemberRole } from "@prisma/client";
import { requireUser } from "@/server/auth/jwt";
import {
  OrgHttpError,
  removeMemberFromOrg,
  updateMemberOrgRole,
} from "@/server/organizations/service";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const { userId } = await context.params;
  const body = await readJsonBody<{ organizationMemberRole?: OrganizationMemberRole }>(
    request,
  );
  if (
    body?.organizationMemberRole !== OrganizationMemberRole.ADMIN &&
    body?.organizationMemberRole !== OrganizationMemberRole.MEMBER
  ) {
    return jsonError("organizationMemberRole is required", 400);
  }
  try {
    return jsonOk(
      await updateMemberOrgRole(user.sub, userId, body.organizationMemberRole),
    );
  } catch (e) {
    if (e instanceof OrgHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}

export async function DELETE(request: Request, context: Ctx) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const { userId } = await context.params;
  try {
    return jsonOk(await removeMemberFromOrg(user.sub, userId));
  } catch (e) {
    if (e instanceof OrgHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
