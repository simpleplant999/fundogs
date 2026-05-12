/**
 * Normalize NEXT_PUBLIC_API_URL so requests hit the Nest global prefix `/api`.
 * Accepts either `http://localhost:4000/api` or `http://localhost:4000`.
 */
export function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/\/api$/i.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    const path = (u.pathname || '/').replace(/\/+$/, '') || '/';
    if (path === '/') {
      return `${trimmed}/api`;
    }
  } catch {
    /* not a valid URL — return as-is */
  }
  return trimmed;
}
