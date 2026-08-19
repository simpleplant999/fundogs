import { CampaignHttpError, updateMine } from "@/server/campaigns/service";
import { requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
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
    return jsonOk(await updateMine(user.sub, id, body ?? {}));
  } catch (e) {
    if (e instanceof CampaignHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
