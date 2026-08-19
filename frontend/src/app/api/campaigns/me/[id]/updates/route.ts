import { CampaignHttpError, createCampaignUpdate } from "@/server/campaigns/service";
import { requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Ctx) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const body = await readJsonBody<{ title?: string; body?: string; imageUrls?: string[] }>(
    request,
  );
  if (!body?.body?.trim()) return jsonError("body is required", 400);
  try {
    return jsonOk(
      await createCampaignUpdate(user.sub, id, {
        title: body.title,
        body: body.body,
        imageUrls: body.imageUrls,
      }),
    );
  } catch (e) {
    if (e instanceof CampaignHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to create update", 500);
  }
}
