import { AuthHttpError, login } from "@/server/auth/service";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export async function POST(request: Request) {
  const body = await readJsonBody<{ email?: string; password?: string }>(request);
  if (!body?.email?.trim() || !body?.password) {
    return jsonError("email and password are required", 400);
  }
  try {
    const result = await login(body.email.trim().toLowerCase(), body.password);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof AuthHttpError) return jsonError(e.message, e.status);
    console.error(e);
    return jsonError("Login failed", 500);
  }
}
