import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import {
  AdminHttpError,
  createOrganization,
  listOrganizations,
} from "@/server/admin/service";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  try {
    return jsonOk(await listOrganizations());
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const body = await readJsonBody<{ name?: string; slug?: string }>(request);
  if (!body?.name?.trim()) return jsonError("name is required", 400);
  try {
    return jsonOk(await createOrganization({ name: body.name, slug: body.slug }));
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
