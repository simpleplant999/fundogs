import { CampaignHttpError, getDonors } from "@/server/campaigns/service";
import { optionalUser } from "@/server/auth/jwt";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: Ctx) {
  const { slug } = await context.params;
  const viewer = await optionalUser(request);
  try {
    return jsonOk(await getDonors(slug, viewer));
  } catch (e) {
    if (e instanceof CampaignHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to load donors", 500);
  }
}
