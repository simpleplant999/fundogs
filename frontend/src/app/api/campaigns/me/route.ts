import { CampaignHttpError, listMine } from "@/server/campaigns/service";
import { requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  try {
    return jsonOk(await listMine(user.sub));
  } catch (e) {
    if (e instanceof CampaignHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to list your campaigns", 500);
  }
}
