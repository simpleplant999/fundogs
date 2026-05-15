import type { Campaign, Comment, Donor } from "./types";
import { normalizeApiBaseUrl } from "./api-base";
import { isCampaignTypeId } from "./campaign-type";
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

export type PublicUserProfile = {
  id: string;
  fullName: string;
  profilePhotoUrl: string;
  organization: { slug: string; name: string; memberRole: "ADMIN" | "MEMBER" } | null;
  campaigns: Campaign[];
};

export async function fetchPublicUserProfile(userId: string): Promise<PublicUserProfile | null> {
  const base = getApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/users/${encodeURIComponent(userId)}/profile`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchPublishedCampaigns(
  campaignType?: string,
): Promise<Campaign[] | null> {
  const base = getApiBase();
  if (!base) return null;
  const q =
    campaignType && isCampaignTypeId(campaignType)
      ? `?type=${encodeURIComponent(campaignType)}`
      : "";
  try {
    const res = await fetch(`${base}/campaigns${q}`, { cache: 'no-store' });
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

export async function loadPublishedCampaigns(campaignType?: string): Promise<Campaign[]> {
  const remote = await fetchPublishedCampaigns(campaignType);
  if (remote && Array.isArray(remote)) return remote;
  const all = getPublishedAndDoneCampaigns();
  if (campaignType && isCampaignTypeId(campaignType)) {
    return all.filter((c) => c.campaignType === campaignType);
  }
  return all;
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
