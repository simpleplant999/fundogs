import { ContactMessageCategory } from "@prisma/client";
import { prisma } from "@/server/db";
import { jsonError, jsonOk, readJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set(Object.values(ContactMessageCategory));

export async function POST(request: Request) {
  const body = await readJsonBody<{
    name?: string;
    email?: string;
    category?: string;
    message?: string;
  }>(request);
  if (!body?.name?.trim() || !body?.email?.trim() || !body?.message?.trim() || !body?.category) {
    return jsonError("name, email, category, and message are required", 400);
  }
  const category = body.category.toUpperCase() as ContactMessageCategory;
  if (!CATEGORIES.has(category)) {
    return jsonError("Invalid category", 400);
  }
  try {
    const row = await prisma.contactMessage.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        category,
        message: body.message.trim(),
      },
    });
    return jsonOk({ id: row.id, ok: true });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to send message", 500);
  }
}
