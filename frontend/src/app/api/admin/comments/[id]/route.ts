import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import { AdminHttpError, moderateComment } from "@/server/admin/service";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await context.params;
  const body = await readJsonBody<{ status?: "visible" | "rejected" }>(request);
  if (body?.status !== "visible" && body?.status !== "rejected") {
    return jsonError("status must be 'visible' or 'rejected'", 400);
  }
  try {
    return jsonOk(await moderateComment(id, body.status));
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
