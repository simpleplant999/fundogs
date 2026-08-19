import { CampaignHttpError, deleteCampaignUpdate } from "@/server/campaigns/service";
import { requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; updateId: string }> };

export async function DELETE(request: Request, context: Ctx) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const { id, updateId } = await context.params;
  try {
    await deleteCampaignUpdate(user.sub, user.role, id, updateId);
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof CampaignHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to delete update", 500);
  }
}
