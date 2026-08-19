import { CampaignHttpError, create, listPublic } from "@/server/campaigns/service";
import { requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? undefined;
  try {
    return jsonOk(await listPublic(type));
  } catch (e) {
    console.error(e);
    return jsonError("Failed to list campaigns", 500);
  }
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
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
  if (
    !body?.title?.trim() ||
    !body?.description?.trim() ||
    body.goalAmount == null ||
    !body?.recipientName?.trim() ||
    !body?.recipientNote?.trim() ||
    !body?.campaignType?.trim()
  ) {
    return jsonError(
      "title, description, goalAmount, recipientName, recipientNote, and campaignType are required",
      400,
    );
  }
  try {
    return jsonOk(
      await create(user.sub, {
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        imageUrls: body.imageUrls,
        goalAmount: Number(body.goalAmount),
        recipientName: body.recipientName,
        recipientNote: body.recipientNote,
        campaignType: body.campaignType,
      }),
    );
  } catch (e) {
    if (e instanceof CampaignHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to create campaign", 500);
  }
}
