/**
 * Normalize NEXT_PUBLIC_API_URL so requests hit `/api`.
 * Accepts absolute Nest/Next bases (`http://localhost:4000/api`, `http://localhost:3000`)
 * or same-origin (`/api`, empty → `/api` when the App Router API is enabled).
 */
export function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed || trimmed === "/api") return "/api";
  if (/\/api$/i.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    const path = (u.pathname || "/").replace(/\/+$/, "") || "/";
    if (path === "/") {
      return `${trimmed}/api`;
    }
  } catch {
    /* relative path — return as-is */
  }
  return trimmed;
}
