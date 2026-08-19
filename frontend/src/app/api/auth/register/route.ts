import { AuthHttpError, register } from "@/server/auth/service";
import { withDbTimeout } from "@/server/db";
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
  if (!process.env.DATABASE_URL?.trim()) {
    return jsonError("Database is not configured (missing DATABASE_URL).", 503);
  }
  try {
    const result = await withDbTimeout(
      register(
        body.email.trim().toLowerCase(),
        body.password,
        body.fullName.trim(),
        body.inviteCode,
      ),
    );
    return jsonOk(result);
  } catch (e) {
    if (e instanceof AuthHttpError) return jsonError(e.message, e.status);
    console.error(e);
    const message = e instanceof Error ? e.message : "Registration failed";
    if (/DATABASE_URL|Mongo|timed out|Server selection/i.test(message)) {
      return jsonError(
        "Cannot reach the database. On Atlas, allow Network Access 0.0.0.0/0 and set DATABASE_URL on Vercel.",
        503,
      );
    }
    return jsonError("Registration failed", 500);
  }
}

export const runtime = "nodejs";
export const maxDuration = 15;
