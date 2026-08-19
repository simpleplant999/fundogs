import { requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk } from "@/server/http";
import { publicUploadUrl, saveUploadedImages } from "@/server/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Expected multipart form data", 400);
  }

  const files = form
    .getAll("files")
    .filter((v): v is File => typeof v === "object" && v !== null && "arrayBuffer" in v);

  if (!files.length) return jsonError("Add at least one image", 400);

  try {
    const filenames = await saveUploadedImages(files.slice(0, 12), "campaigns");
    return jsonOk({
      urls: filenames.map((name) => publicUploadUrl(request, "campaigns", name)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    if (message.includes("image") || message.includes("5MB")) {
      return jsonError(message, 400);
    }
    console.error(e);
    return jsonError("Upload failed", 500);
  }
}
