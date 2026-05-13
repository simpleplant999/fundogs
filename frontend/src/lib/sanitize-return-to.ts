/** Allow only same-site relative paths (open-redirect safe). */
export function sanitizeInternalReturnPath(
  raw: string | string[] | undefined,
): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string" || v.length === 0 || v.length > 2048) return null;
  const decoded = (() => {
    try {
      return decodeURIComponent(v.trim());
    } catch {
      return null;
    }
  })();
  if (!decoded) return null;
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("://") || decoded.includes("\\")) return null;
  if (decoded.includes("@")) return null;
  return decoded;
}
