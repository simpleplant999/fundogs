import { prisma } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return new Response("Not found", { status: 404 });
  }

  const row = await prisma.uploadedFile.findUnique({
    where: { id: id.trim() },
    select: { data: true, mimeType: true },
  });
  if (!row) return new Response("Not found", { status: 404 });

  const body = row.data instanceof Uint8Array ? row.data : new Uint8Array(row.data);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": row.mimeType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
