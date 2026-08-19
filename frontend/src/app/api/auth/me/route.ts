import { AuthHttpError, getMe, updateMe } from "@/server/auth/service";
import { requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  try {
    return jsonOk(await getMe(user.sub));
  } catch (e) {
    if (e instanceof AuthHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to load profile", 500);
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  const body = await readJsonBody<{
    fullName?: string;
    currentPassword?: string;
    newPassword?: string;
    profilePhotoUrl?: string;
  }>(request);
  if (!body) return jsonError("Invalid JSON body", 400);
  try {
    return jsonOk(await updateMe(user.sub, body));
  } catch (e) {
    if (e instanceof AuthHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Failed to update profile", 500);
  }
}
