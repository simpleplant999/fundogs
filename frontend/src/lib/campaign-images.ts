import type { Campaign } from '@/lib/types';

const MAX_IMAGES = 12;

export function getCampaignImages(c: Pick<Campaign, 'images' | 'imageUrl'>): string[] {
  if (c.images?.length) return [...c.images];
  return [c.imageUrl];
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
  return data.urls;
}
