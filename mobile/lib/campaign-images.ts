import type { Campaign } from './types';

export function getCampaignImages(c: Pick<Campaign, 'images' | 'imageUrl'>): string[] {
  if (c.images?.length) return [...c.images];
  return [c.imageUrl];
}

function apiOriginFromBase(apiBase: string): string | null {
  const base = apiBase.trim().replace(/\/+$/, '');
  if (!base) return null;
  try {
    const api = new URL(base.includes('://') ? base : `https://${base}`);
    return `${api.protocol}//${api.host}`;
  } catch {
    return null;
  }
}

/** Hosts where the API often stored upload URLs during dev; must be rewritten to the client’s API host. */
function isLoopbackStyleHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

/**
 * Resolve media URLs so `<Image source={{ uri }} />` loads on device/emulator/web.
 * - Relative `/uploads/...` → current API origin (from EXPO_PUBLIC_API_URL).
 * - Absolute URLs that point at our static uploads or loopback dev API → same path on API origin.
 * - Other absolute URLs (e.g. CDN) → returned unchanged.
 */
export function resolveMediaUrlToApiOrigin(apiBase: string, url: string): string {
  const raw = url.trim();
  if (!raw || raw.startsWith('blob:') || raw.startsWith('data:')) return raw;

  const origin = apiOriginFromBase(apiBase);
  if (!origin) return raw;

  if (raw.startsWith('//')) {
    try {
      const api = new URL(origin);
      return `${api.protocol}${raw}`;
    } catch {
      return raw;
    }
  }

  if (raw.startsWith('/')) {
    return `${origin}${raw}`;
  }

  try {
    const u = new URL(raw);
    const uploadPath = u.pathname.startsWith('/uploads/');
    const loopbackHost = isLoopbackStyleHost(u.hostname);

    let apiHostname: string | null = null;
    try {
      apiHostname = new URL(origin).hostname;
    } catch {
      apiHostname = null;
    }
    const sameHostAsConfiguredApi = apiHostname !== null && u.hostname === apiHostname;

    if (uploadPath || loopbackHost || sameHostAsConfiguredApi) {
      return `${origin}${u.pathname}${u.search}`;
    }
    return raw;
  } catch {
    return raw;
  }
}
