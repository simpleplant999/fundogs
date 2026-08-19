import { prisma } from "./db";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i;
/** Stay under Vercel’s ~4.5MB request body limit. */
const MAX_BYTES = 4 * 1024 * 1024;

export function isAllowedImageFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  if (IMAGE_EXT.test(file.name) && (!mime || mime === "application/octet-stream")) {
    return true;
  }
  return false;
}

export type UploadSubdir = "campaigns" | "users" | "organizations";

function mimeOf(file: File): string {
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return mime;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

/** Public path stored on campaigns / profiles. */
export function mediaUrl(id: string) {
  return `/api/media/${id}`;
}

/**
 * Persist images in MongoDB so uploads work on Vercel (read-only filesystem).
 * Returns public URLs (`/api/media/:id`).
 */
export async function saveUploadedImages(
  files: File[],
  subdir: UploadSubdir,
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    if (!isAllowedImageFile(file)) {
      throw new Error("Only image uploads are allowed");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("Each image must be 4MB or smaller");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const row = await prisma.uploadedFile.create({
      data: {
        subdir,
        mimeType: mimeOf(file),
        data: buffer,
      },
    });
    urls.push(mediaUrl(row.id));
  }
  return urls;
}
