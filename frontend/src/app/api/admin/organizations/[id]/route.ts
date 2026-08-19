import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import {
  AdminHttpError,
  deleteOrganization,
  getOrganizationAdmin,
  updateOrganization,
} from "@/server/admin/service";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await context.params;
  try {
    return jsonOk(await getOrganizationAdmin(id));
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}

export async function PATCH(request: Request, context: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await context.params;
  const body = await readJsonBody<{ name?: string; slug?: string }>(request);
  try {
    return jsonOk(await updateOrganization(id, body ?? {}));
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}

export async function DELETE(request: Request, context: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await context.params;
  try {
    return jsonOk(await deleteOrganization(id));
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
