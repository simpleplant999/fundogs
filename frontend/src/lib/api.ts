import type { Campaign, Comment, Donor } from "./types";
import { normalizeApiBaseUrl } from "./api-base";
import { isCampaignTypeId } from "./campaign-type";
import {
  getCampaignBySlug,
  getCommentsForCampaign,
  getDonorsForCampaign,
  getPublishedAndDoneCampaigns,
} from "./data";

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Base URL including `/api`.
 * Defaults to same-origin `/api` (App Router). On the server, relative `/api`
 * is expanded using the incoming request host (so port 3002 works, not hardcoded 3000).
 */
export function getApiBase(): string {
  const normalized = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? "/api");
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (typeof window !== "undefined") return normalized;
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const fromVercel = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
    : "";
  const origin = fromEnv || fromVercel || "http://localhost:3000";
  return `${origin}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

/** Async base URL that reads the current request Host (fixes wrong-port SSR fetches). */
export async function resolveApiBase(): Promise<string> {
  const normalized = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? "/api");
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (typeof window !== "undefined") return normalized;

  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
        (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
      return `${proto}://${host}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
    }
  } catch {
    /* outside a request (e.g. build) */
  }

  return getApiBase();
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
  if (typeof window === "undefined" && hasDatabase()) {
    try {
      const { listPublic } = await import("@/server/organizations/service");
      return await listPublic();
    } catch (e) {
      console.error("fetchOrganizations direct failed", e);
    }
  }
  const base = await resolveApiBase();
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
  if (typeof window === "undefined" && hasDatabase()) {
    try {
      const { getPublicProfile } = await import("@/server/users/service");
      return (await getPublicProfile(userId)) as PublicUserProfile;
    } catch {
      return null;
    }
  }
  const base = await resolveApiBase();
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
  if (typeof window === "undefined" && hasDatabase()) {
    try {
      const { listPublic } = await import("@/server/campaigns/service");
      return (await withTimeout(listPublic(campaignType), 8000)) as Campaign[];
    } catch (e) {
      console.error("fetchPublishedCampaigns direct failed", e);
      return null;
    }
  }
  const base = await resolveApiBase();
  if (!base) return null;
  const q =
    campaignType && isCampaignTypeId(campaignType)
      ? `?type=${encodeURIComponent(campaignType)}`
      : "";
  try {
    const res = await fetch(`${base}/campaigns${q}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCampaignBySlug(slug: string): Promise<Campaign | null> {
  if (typeof window === "undefined" && hasDatabase()) {
    try {
      const { getBySlug, CampaignHttpError } = await import("@/server/campaigns/service");
      return (await getBySlug(slug)) as Campaign;
    } catch (e) {
      const err = e as { status?: number; name?: string };
      if (err?.status === 404) return null;
      console.error("fetchCampaignBySlug direct failed", e);
      return null;
    }
  }
  const base = await resolveApiBase();
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
  if (typeof window === "undefined" && hasDatabase()) {
    try {
      const { getDonors } = await import("@/server/campaigns/service");
      return (await getDonors(slug)) as Donor[];
    } catch {
      return null;
    }
  }
  const base = await resolveApiBase();
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
  if (typeof window === "undefined" && hasDatabase()) {
    try {
      const { getComments } = await import("@/server/campaigns/service");
      return (await getComments(slug)) as Comment[];
    } catch {
      return null;
    }
  }
  const base = await resolveApiBase();
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
  // Do not fall back to static mock data when the App Router API / MongoDB is in use.
  return [];
}

export async function loadCampaignPageData(slug: string): Promise<{
  campaign: Campaign;
  donors: Donor[];
  comments: Comment[];
} | null> {
  if (!hasDatabase() && !(await resolveApiBase())) {
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
