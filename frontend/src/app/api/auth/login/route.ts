import { AuthHttpError, login } from "@/server/auth/service";
import { withDbTimeout } from "@/server/db";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export async function POST(request: Request) {
  const body = await readJsonBody<{ email?: string; password?: string }>(request);
  if (!body?.email?.trim() || !body?.password) {
    return jsonError("email and password are required", 400);
  }
  if (!process.env.DATABASE_URL?.trim()) {
    return jsonError("Database is not configured (missing DATABASE_URL).", 503);
  }
  try {
    const result = await withDbTimeout(
      login(body.email.trim().toLowerCase(), body.password),
    );
    return jsonOk(result);
  } catch (e) {
    if (e instanceof AuthHttpError) return jsonError(e.message, e.status);
    console.error(e);
    const message = e instanceof Error ? e.message : "Login failed";
    if (/DATABASE_URL|Mongo|timed out|Server selection/i.test(message)) {
      return jsonError(
        "Cannot reach the database. On Atlas, allow Network Access 0.0.0.0/0 and set DATABASE_URL on Vercel.",
        503,
      );
    }
    return jsonError("Login failed", 500);
  }
}

export const runtime = "nodejs";
export const maxDuration = 15;
