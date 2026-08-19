import type {
  Campaign,
  CampaignLifecycleStatus,
  CampaignUpdate,
  Comment,
  Donation,
  User,
} from "@prisma/client";
import { CampaignType } from "@prisma/client";
import type { ApiCampaignTypeValue } from "./campaign-type";
import { prismaCampaignTypeToApi } from "./campaign-type";

export type ApiCampaign = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  images: string[];
  goalAmount: number;
  raisedAmount: number;
  campaignType: ApiCampaignTypeValue;
  status: "Published" | "Draft" | "Archived" | "Done";
  approvalStatus: "pending" | "approved" | "rejected";
  recipientName: string;
  recipientNote: string;
  authorId: string;
  author?: {
    id: string;
    fullName: string;
    organization: { name: string; slug: string } | null;
  };
};

export type ApiComment = {
  id: string;
  author: string;
  body: string;
  status: "visible" | "pending" | "rejected";
  createdAt: string;
};

export type ApiDonor = {
  id: string;
  name: string;
  amount: number | null;
  hideAmount: boolean;
  verification: "verified" | "pending" | "rejected";
  date: string;
};

export type ApiCampaignUpdate = {
  id: string;
  title: string;
  body: string;
  images: string[];
  createdAt: string;
};

function lifecycleToStatus(s: CampaignLifecycleStatus): ApiCampaign["status"] {
  const m: Record<CampaignLifecycleStatus, ApiCampaign["status"]> = {
    DRAFT: "Draft",
    PUBLISHED: "Published",
    ARCHIVED: "Archived",
    DONE: "Done",
  };
  return m[s];
}

function toPublicMediaUrl(url: string): string {
  const raw = url.trim();
  if (!raw) return raw;
  if (raw.startsWith("/")) return raw;
  try {
    const u = new URL(raw);
    if (u.pathname.startsWith("/uploads/")) return `${u.pathname}${u.search}`;
    return raw;
  } catch {
    return raw;
  }
}

function galleryUrls(c: Campaign): string[] {
  const raw = c.imageUrls?.length ? [...c.imageUrls] : [c.imageUrl];
  return raw.map(toPublicMediaUrl).filter(Boolean);
}

type CampaignWithAuthorOpt = Campaign & {
  author?: {
    id?: string;
    fullName: string;
    organization: { name: string; slug: string } | null;
  } | null;
};

export function mapCampaign(c: CampaignWithAuthorOpt): ApiCampaign {
  const images = galleryUrls(c);
  const author =
    c.author && typeof c.author === "object"
      ? {
          id: c.author.id ?? c.authorId,
          fullName: c.author.fullName,
          organization: c.author.organization
            ? { name: c.author.organization.name, slug: c.author.organization.slug }
            : null,
        }
      : undefined;
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    imageUrl: toPublicMediaUrl(images[0] ?? c.imageUrl),
    images,
    goalAmount: c.goalAmount,
    raisedAmount: c.raisedAmount,
    campaignType: prismaCampaignTypeToApi(
      (c as Campaign & { campaignType?: CampaignType }).campaignType ?? CampaignType.OTHER,
    ),
    status: lifecycleToStatus(c.lifecycleStatus),
    approvalStatus: c.approvalStatus.toLowerCase() as ApiCampaign["approvalStatus"],
    recipientName: c.recipientName,
    recipientNote: c.recipientNote,
    authorId: c.authorId,
    ...(author ? { author } : {}),
  };
}

export function mapComment(c: Comment & { author?: User | null }): ApiComment {
  const st = c.moderationStatus.toLowerCase() as ApiComment["status"];
  return {
    id: c.id,
    author: c.author?.fullName ?? "User",
    body: c.body,
    status: st,
    createdAt: c.createdAt.toISOString(),
  };
}

export function mapCampaignUpdate(row: CampaignUpdate): ApiCampaignUpdate {
  const imgs = row.imageUrls;
  const images = imgs?.length ? imgs.map(toPublicMediaUrl) : [];
  return {
    id: row.id,
    title: row.title.trim(),
    body: row.body,
    images,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapDonation(d: Donation): ApiDonor {
  const v = d.verificationStatus.toLowerCase() as ApiDonor["verification"];
  const hide = d.hideAmountPublic;
  return {
    id: d.id,
    name: d.donorDisplayName,
    amount: hide ? null : d.amount,
    hideAmount: hide,
    verification: v === "verified" ? "verified" : v === "rejected" ? "rejected" : "pending",
    date: d.createdAt.toISOString(),
  };
}
