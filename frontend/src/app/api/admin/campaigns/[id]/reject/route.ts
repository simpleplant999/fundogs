import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import { AdminHttpError, rejectCampaign } from "@/server/admin/service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await context.params;
  try {
    return jsonOk(await rejectCampaign(id));
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
