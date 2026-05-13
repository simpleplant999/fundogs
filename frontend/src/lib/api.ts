import type { Campaign, Comment, Donor } from "./types";
import { normalizeApiBaseUrl } from "./api-base";
import {
  getCampaignBySlug,
  getCommentsForCampaign,
  getDonorsForCampaign,
  getPublishedAndDoneCampaigns,
} from "./data";

/** Base URL including `/api`, e.g. `http://localhost:4000/api` */
export function getApiBase(): string {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? "");
}

export type PublicOrganizationListItem = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  profilePhotoUrl: string;
  memberCount: number;
};

export async function fetchOrganizations(): Promise<PublicOrganizationListItem[] | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/organizations`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchPublishedCampaigns(): Promise<Campaign[] | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/campaigns`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCampaignBySlug(slug: string): Promise<Campaign | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/campaigns/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchDonors(slug: string): Promise<Donor[] | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/campaigns/${encodeURIComponent(slug)}/donors`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchComments(slug: string): Promise<Comment[] | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/campaigns/${encodeURIComponent(slug)}/comments`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function loadPublishedCampaigns(): Promise<Campaign[]> {
  const remote = await fetchPublishedCampaigns();
  if (remote && Array.isArray(remote)) return remote;
  return getPublishedAndDoneCampaigns();
}

export async function loadCampaignPageData(slug: string): Promise<{
  campaign: Campaign;
  donors: Donor[];
  comments: Comment[];
} | null> {
  if (!getApiBase()) {
    const campaign = getCampaignBySlug(slug);
    if (!campaign) return null;
    return {
      campaign,
      donors: getDonorsForCampaign(slug),
      comments: getCommentsForCampaign(slug),
    };
  }
  const campaign = await fetchCampaignBySlug(slug);
  if (!campaign) return null;
  const [donors, comments] = await Promise.all([fetchDonors(slug), fetchComments(slug)]);
  return {
    campaign,
    donors: donors ?? [],
    comments: comments ?? [],
  };
}
