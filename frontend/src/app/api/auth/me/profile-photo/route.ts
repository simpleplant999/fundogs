import { AuthHttpError, setProfilePhotoUrl } from "@/server/auth/service";
import { requireUser } from "@/server/auth/jwt";
import { jsonError, jsonOk } from "@/server/http";
import { saveUploadedImages } from "@/server/uploads";

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

  const file = form.get("file");
  if (!(file instanceof File) || !("arrayBuffer" in file)) {
    return jsonError("Choose an image file", 400);
  }

  try {
    const [url] = await saveUploadedImages([file], "users");
    return jsonOk(await setProfilePhotoUrl(user.sub, url));
  } catch (e) {
    if (e instanceof AuthHttpError) return jsonError(e.message, e.status);
    const message = e instanceof Error ? e.message : "Upload failed";
    if (message.includes("image") || message.includes("4MB") || message.includes("5MB")) {
      return jsonError(message, 400);
    }
    console.error(e);
    return jsonError("Upload failed", 500);
  }
}
