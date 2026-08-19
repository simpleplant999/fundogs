import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { extname, join } from "path";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i;
const MAX_BYTES = 5 * 1024 * 1024;

export function isAllowedImageFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  if (IMAGE_EXT.test(file.name) && (!mime || mime === "application/octet-stream")) {
    return true;
  }
  return false;
}

export type UploadSubdir = "campaigns" | "users" | "organizations";

export function publicUploadUrl(request: Request, subdir: UploadSubdir, filename: string) {
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    "localhost:3000";
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.includes("localhost") ? "http" : "https");
  const safeProto = proto === "https" ? "https" : "http";
  return `${safeProto}://${host}/uploads/${subdir}/${filename}`;
}

/** Save under `public/uploads/<subdir>` so Next can serve at `/uploads/...`. */
export async function saveUploadedImages(
  files: File[],
  subdir: UploadSubdir,
): Promise<string[]> {
  const dir = join(process.cwd(), "public", "uploads", subdir);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const names: string[] = [];
  for (const file of files) {
    if (!isAllowedImageFile(file)) {
      throw new Error("Only image uploads are allowed");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("Each image must be 5MB or smaller");
    }
    const ext = extname(file.name) || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);
    names.push(filename);
  }
  return names;
}
