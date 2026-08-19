import { AuthHttpError, register } from "@/server/auth/service";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export async function POST(request: Request) {
  const body = await readJsonBody<{
    email?: string;
    password?: string;
    fullName?: string;
    inviteCode?: string;
  }>(request);
  if (!body?.email?.trim() || !body?.password || !body?.fullName?.trim()) {
    return jsonError("email, password, and fullName are required", 400);
  }
  try {
    const result = await register(
      body.email.trim().toLowerCase(),
      body.password,
      body.fullName.trim(),
      body.inviteCode,
    );
    return jsonOk(result);
  } catch (e) {
    if (e instanceof AuthHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Registration failed", 500);
  }
}
