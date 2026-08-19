import { getPublicProfile, UserHttpError } from "@/server/users/service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { userId } = await context.params;
  try {
    return jsonOk(await getPublicProfile(userId));
  } catch (e) {
    if (e instanceof UserHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
