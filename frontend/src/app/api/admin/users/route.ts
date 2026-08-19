import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import { AdminHttpError, listUsers } from "@/server/admin/service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  try {
    return jsonOk(await listUsers());
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
