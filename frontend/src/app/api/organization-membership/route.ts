import { requireUser } from "@/server/auth/jwt";
import {
  getMineForEdit,
  OrgHttpError,
  updateMine,
} from "@/server/organizations/service";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  try {
    return jsonOk(await getMineForEdit(user.sub));
  } catch (e) {
    if (e instanceof OrgHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const body = await readJsonBody<{
    name?: string;
    slug?: string;
    bio?: string;
    profilePhotoUrl?: string;
    coverPhotoUrl?: string;
    photoUrls?: string[];
  }>(request);
  try {
    return jsonOk(await updateMine(user.sub, body ?? {}));
  } catch (e) {
    if (e instanceof OrgHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed", 500);
  }
}
