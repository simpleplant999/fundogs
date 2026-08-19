import { prisma } from "@/server/db";
import { jsonError, jsonOk } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  const hasUrl = Boolean(process.env.DATABASE_URL?.trim());
  if (!hasUrl) {
    return jsonError("DATABASE_URL is not set on this deployment.", 503);
  }
  try {
    await prisma.user.findFirst({ select: { id: true } });
    return jsonOk({ ok: true, database: "connected" });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Database unreachable";
    return jsonError(
      /timed out|Server selection|ENOTFOUND|ECONNREFUSED|Mongo/i.test(message)
        ? "Cannot reach MongoDB. In Atlas → Network Access, allow 0.0.0.0/0 (or Vercel IPs). Confirm DATABASE_URL includes the database name /fundogs."
        : message,
      503,
    );
  }
}
