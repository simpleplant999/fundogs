import {
  CampaignHttpError,
  addComment,
  getComments,
} from "@/server/campaigns/service";
import { optionalUser, requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const viewer = await optionalUser(request);
  try {
    return jsonOk(await getComments(slug, viewer));
  } catch (e) {
    if (e instanceof CampaignHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to load comments", 500);
  }
}

export async function POST(request: Request, context: Ctx) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const { slug } = await context.params;
  const body = await readJsonBody<{ body?: string }>(request);
  if (!body?.body?.trim()) return jsonError("body is required", 400);
  try {
    return jsonOk(await addComment(slug, user.sub, body.body));
  } catch (e) {
    if (e instanceof CampaignHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to add comment", 500);
  }
}
