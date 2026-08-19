import { isResponse, requireAdmin } from "@/server/auth/require-admin";
import {
  AdminHttpError,
  deleteCampaign,
  updateCampaignAdmin,
} from "@/server/admin/service";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await context.params;
  const body = await readJsonBody<{
    title?: string;
    description?: string;
    imageUrl?: string;
    imageUrls?: string[];
    goalAmount?: number;
    recipientName?: string;
    recipientNote?: string;
    campaignType?: string;
  }>(request);
  try {
    return jsonOk(await updateCampaignAdmin(id, body ?? {}));
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
    return jsonOk(await deleteCampaign(id));
  } catch (e) {
    if (e instanceof AdminHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
