import { requireUser } from "@/server/auth/jwt";
import { listMembersForOrgAdmin, OrgHttpError } from "@/server/organizations/service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  try {
    return jsonOk(await listMembersForOrgAdmin(user.sub));
  } catch (e) {
    if (e instanceof OrgHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
