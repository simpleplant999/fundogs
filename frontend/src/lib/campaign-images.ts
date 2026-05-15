import type { Campaign } from '@/lib/types';

const MAX_IMAGES = 12;

export function getCampaignImages(c: Pick<Campaign, 'images' | 'imageUrl'>): string[] {
  if (c.images?.length) return [...c.images];
  return [c.imageUrl];
}

/**
 * Use the same origin the app uses for `fetch(apiBase/...)`, so images load in the browser.
 * Nest builds upload URLs from `Host` / `X-Forwarded-*`, which often differs from NEXT_PUBLIC_API_URL.
 */
export function resolveMediaUrlToApiOrigin(apiBase: string, url: string): string {
  const raw = url.trim();
  if (!raw || raw.startsWith('blob:') || raw.startsWith('data:')) return raw;
  const base = apiBase.trim().replace(/\/+$/, '');
  if (!base) return raw;
  try {
    const api = new URL(base.includes('://') ? base : `https://${base}`);
    const origin = `${api.protocol}//${api.host}`;
    if (raw.startsWith('/')) {
      return `${origin}${raw}`;
    }
    const u = new URL(raw);
    return `${origin}${u.pathname}${u.search}`;
  } catch {
    return raw;
  }
}

export async function uploadCampaignImages(
  apiBase: string,
  token: string,
  files: File[],
): Promise<string[]> {
  if (!files.length) return [];
  const fd = new FormData();
  for (const f of files.slice(0, MAX_IMAGES)) {
    fd.append('files', f);
  }
  const res = await fetch(`${apiBase}/campaigns/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[];
    urls?: string[];
  };
  if (!res.ok) {
    const msg =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : `Upload failed (${res.status})`;
    throw new Error(msg);
  }
  if (!data.urls?.length) throw new Error('No image URLs returned from server.');
  return data.urls.map((u) => resolveMediaUrlToApiOrigin(apiBase, u));
}
