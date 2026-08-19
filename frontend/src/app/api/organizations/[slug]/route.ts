import { findPublicBySlug, OrgHttpError } from "@/server/organizations/service";
import { jsonError, jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  try {
    return jsonOk(await findPublicBySlug(slug));
  } catch (e) {
    if (e instanceof OrgHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
