import type { Campaign, CampaignUpdate, Comment, Donor } from './types';
import { normalizeApiBaseUrl } from './api-base';
import { getApiUrlRaw } from './env';
import { isCampaignTypeId } from './campaign-type';

/** Base URL including `/api`. */
export function getApiBase(): string {
  return normalizeApiBaseUrl(getApiUrlRaw());
}

export type PublicOrganizationListItem = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  profilePhotoUrl: string;
  memberCount: number;
};

export type PublicOrganizationDetail = PublicOrganizationListItem & {
  coverPhotoUrl: string;
  photoUrls: string[];
  createdAt: string;
};

async function parseJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchOrganizations(): Promise<PublicOrganizationListItem[] | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/organizations`);
    return parseJson<PublicOrganizationListItem[]>(res);
  } catch {
    return null;
  }
}

export async function fetchOrganizationBySlug(slug: string): Promise<PublicOrganizationDetail | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/organizations/${encodeURIComponent(slug)}`);
    return parseJson<PublicOrganizationDetail>(res);
  } catch {
    return null;
  }
}

export async function fetchOrganizationCampaigns(slug: string): Promise<Campaign[] | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/organizations/${encodeURIComponent(slug)}/campaigns`);
    return parseJson<Campaign[]>(res);
  } catch {
    return null;
  }
}

export async function fetchPublishedCampaigns(campaignType?: string): Promise<Campaign[] | null> {
  const base = getApiBase();
  if (!base) return null;
  const q =
    campaignType && isCampaignTypeId(campaignType) ? `?type=${encodeURIComponent(campaignType)}` : '';
  try {
    const res = await fetch(`${base}/campaigns${q}`);
    return parseJson<Campaign[]>(res);
  } catch {
    return null;
  }
}

export async function fetchCampaignBySlug(
  slug: string,
  token?: string | null,
): Promise<Campaign | null> {
  const base = getApiBase();
  if (!base) return null;
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${base}/campaigns/${encodeURIComponent(slug)}`, { headers });
    return parseJson<Campaign>(res);
  } catch {
    return null;
  }
}

export async function fetchDonors(slug: string, token?: string | null): Promise<Donor[] | null> {
  const base = getApiBase();
  if (!base) return null;
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${base}/campaigns/${encodeURIComponent(slug)}/donors`, { headers });
    return parseJson<Donor[]>(res);
  } catch {
    return null;
  }
}

export async function fetchComments(slug: string, token?: string | null): Promise<Comment[] | null> {
  const base = getApiBase();
  if (!base) return null;
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${base}/campaigns/${encodeURIComponent(slug)}/comments`, { headers });
    return parseJson<Comment[]>(res);
  } catch {
    return null;
  }
}

export async function fetchCampaignUpdates(
  slug: string,
  token?: string | null,
): Promise<CampaignUpdate[] | null> {
  const base = getApiBase();
  if (!base) return null;
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${base}/campaigns/${encodeURIComponent(slug)}/updates`, { headers });
    return parseJson<CampaignUpdate[]>(res);
  } catch {
    return null;
  }
}

export async function fetchMyCampaigns(token: string): Promise<Campaign[] | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/campaigns/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseJson<Campaign[]>(res);
  } catch {
    return null;
  }
}
