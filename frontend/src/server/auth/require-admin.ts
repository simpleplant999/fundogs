import { UserRole } from "@prisma/client";
import { requireUser, type JwtUserPayload } from "./jwt";
import { jsonError } from "../http";

export async function requireAdmin(
  request: Request,
): Promise<JwtUserPayload | Response> {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== UserRole.ADMIN) return jsonError("Forbidden", 403);
  return user;
}

export function isResponse(value: JwtUserPayload | Response): value is Response {
  return value instanceof Response;
}
