import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export type JwtUserPayload = {
  sub: string;
  role: UserRole;
  email: string;
};

function getSecret() {
  const secret = process.env.JWT_SECRET || "dev-insecure-change-me";
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: JwtUserPayload): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<JwtUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const role = payload.role as UserRole | undefined;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!sub || !role || !email) return null;
    return { sub, role, email };
  } catch {
    return null;
  }
}

export function bearerTokenFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return null;
  const [scheme, token] = header.split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim() || null;
}

export async function requireUser(request: Request): Promise<JwtUserPayload | null> {
  const token = bearerTokenFromRequest(request);
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function optionalUser(request: Request): Promise<JwtUserPayload | undefined> {
  const token = bearerTokenFromRequest(request);
  if (!token) return undefined;
  return (await verifyAccessToken(token)) ?? undefined;
}
