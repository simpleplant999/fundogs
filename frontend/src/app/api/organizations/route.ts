import { listPublic, OrgHttpError } from "@/server/organizations/service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await listPublic());
  } catch (e) {
    if (e instanceof OrgHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to list organizations", 500);
  }
}
