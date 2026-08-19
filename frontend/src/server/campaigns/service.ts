import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  CommentModerationStatus,
  DonationVerificationStatus,
  UserRole,
  type Campaign,
} from "@prisma/client";
import { prisma } from "../db";
import type { JwtUserPayload } from "../auth/jwt";
import {
  mapCampaign,
  mapCampaignUpdate,
  mapComment,
  mapDonation,
  type ApiCampaign,
  type ApiCampaignUpdate,
} from "../mappers";
import { PLATFORM_SUPPORT_CAMPAIGN_SLUG } from "../platform-support";
import {
  apiCampaignTypeToPrisma,
  tryApiCampaignTypeToPrisma,
} from "../campaign-type";

export class CampaignHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "campaign";
}

function isPublicVisible(c: Campaign): boolean {
  return (
    c.approvalStatus === CampaignApprovalStatus.APPROVED &&
    (c.lifecycleStatus === CampaignLifecycleStatus.PUBLISHED ||
      c.lifecycleStatus === CampaignLifecycleStatus.DONE)
  );
}

function canViewCampaign(c: Campaign, viewer?: JwtUserPayload): boolean {
  if (isPublicVisible(c)) return true;
  if (!viewer) return false;
  if (viewer.role === "ADMIN") return true;
  return c.authorId === viewer.sub;
}

const AUTHOR_PUBLIC_SELECT = {
  select: {
    id: true,
    fullName: true,
    organization: { select: { name: true, slug: true } },
  },
} as const;

function normalizeCampaignImages(input: {
  imageUrl?: string;
  imageUrls?: string[];
}): string[] {
  if (input.imageUrls?.length) {
    return input.imageUrls.map((u) => u.trim()).filter(Boolean).slice(0, 12);
  }
  const one = (input.imageUrl ?? "").trim();
  return one ? [one] : [];
}

export async function listPublic(campaignTypeFilter?: string): Promise<ApiCampaign[]> {
  const ct = tryApiCampaignTypeToPrisma(campaignTypeFilter);
  const rows = await prisma.campaign.findMany({
    where: {
      slug: { not: PLATFORM_SUPPORT_CAMPAIGN_SLUG },
      approvalStatus: CampaignApprovalStatus.APPROVED,
      lifecycleStatus: {
        in: [CampaignLifecycleStatus.PUBLISHED, CampaignLifecycleStatus.DONE],
      },
      ...(ct !== undefined ? { campaignType: ct } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { author: AUTHOR_PUBLIC_SELECT },
  });
  return rows.map((c) => mapCampaign(c));
}

/** Same visibility rules as {@link listPublic}, scoped to one author. */
export async function listPublicByAuthorId(authorId: string): Promise<ApiCampaign[]> {
  const rows = await prisma.campaign.findMany({
    where: {
      authorId,
      slug: { not: PLATFORM_SUPPORT_CAMPAIGN_SLUG },
      approvalStatus: CampaignApprovalStatus.APPROVED,
      lifecycleStatus: {
        in: [CampaignLifecycleStatus.PUBLISHED, CampaignLifecycleStatus.DONE],
      },
    },
    orderBy: { createdAt: "desc" },
    include: { author: AUTHOR_PUBLIC_SELECT },
  });
  return rows.map((c) => mapCampaign(c));
}

export async function listMine(userId: string) {
  const rows = await prisma.campaign.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    include: { author: AUTHOR_PUBLIC_SELECT },
  });
  return rows.map((c) => ({
    ...mapCampaign(c),
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function getBySlug(slug: string, viewer?: JwtUserPayload): Promise<ApiCampaign> {
  const c = await prisma.campaign.findUnique({
    where: { slug },
    include: { author: AUTHOR_PUBLIC_SELECT },
  });
  if (!c) throw new CampaignHttpError(404, `Campaign not found: ${slug}`);
  if (!canViewCampaign(c, viewer)) {
    throw new CampaignHttpError(404, `Campaign not found: ${slug}`);
  }
  return mapCampaign(c);
}

export async function updateMine(
  userId: string,
  campaignId: string,
  dto: {
    title?: string;
    description?: string;
    imageUrl?: string;
    imageUrls?: string[];
    goalAmount?: number;
    recipientName?: string;
    recipientNote?: string;
    campaignType?: string;
  },
): Promise<ApiCampaign> {
  const c = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!c) throw new CampaignHttpError(404, "Campaign not found");
  if (c.authorId !== userId) throw new CampaignHttpError(403, "Not your campaign");

  const data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    imageUrls?: string[];
    goalAmount?: number;
    recipientName?: string;
    recipientNote?: string;
    campaignType?: ReturnType<typeof apiCampaignTypeToPrisma>;
    approvalStatus?: CampaignApprovalStatus;
    lifecycleStatus?: CampaignLifecycleStatus;
  } = {};
  if (dto.title !== undefined) data.title = dto.title.trim();
  if (dto.description !== undefined) data.description = dto.description.trim();
  if (dto.imageUrls !== undefined) {
    const imgs = normalizeCampaignImages({ imageUrls: dto.imageUrls });
    data.imageUrls = imgs;
    data.imageUrl = imgs[0];
  } else if (dto.imageUrl !== undefined) {
    const imgs = normalizeCampaignImages({ imageUrl: dto.imageUrl });
    data.imageUrls = imgs;
    data.imageUrl = imgs[0];
  }
  if (dto.goalAmount !== undefined) data.goalAmount = dto.goalAmount;
  if (dto.recipientName !== undefined) data.recipientName = dto.recipientName.trim();
  if (dto.recipientNote !== undefined) data.recipientNote = dto.recipientNote.trim();
  if (dto.campaignType !== undefined) {
    data.campaignType = apiCampaignTypeToPrisma(dto.campaignType);
  }

  if (Object.keys(data).length === 0) {
    throw new CampaignHttpError(400, "Provide at least one field to update");
  }

  if (c.approvalStatus === CampaignApprovalStatus.REJECTED) {
    data.approvalStatus = CampaignApprovalStatus.PENDING;
    data.lifecycleStatus = CampaignLifecycleStatus.DRAFT;
  }

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data,
  });
  const full = await prisma.campaign.findUnique({
    where: { id: updated.id },
    include: { author: AUTHOR_PUBLIC_SELECT },
  });
  if (!full) throw new CampaignHttpError(404, "Campaign not found");
  return mapCampaign(full);
}

async function getCampaignRowBySlug(slug: string): Promise<Campaign> {
  const c = await prisma.campaign.findUnique({ where: { slug } });
  if (!c) throw new CampaignHttpError(404, `Campaign not found: ${slug}`);
  return c;
}

export async function getDonors(slug: string, viewer?: JwtUserPayload) {
  const c = await getCampaignRowBySlug(slug);
  if (!canViewCampaign(c, viewer)) throw new CampaignHttpError(404, "Not found");
  const canSeePending =
    !!viewer && (viewer.role === UserRole.ADMIN || viewer.sub === c.authorId);
  const rows = await prisma.donation.findMany({
    where: {
      campaignId: c.id,
      ...(!canSeePending ? { verificationStatus: DonationVerificationStatus.VERIFIED } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return rows.map(mapDonation);
}

export async function getComments(slug: string, viewer?: JwtUserPayload) {
  const c = await getCampaignRowBySlug(slug);
  if (!canViewCampaign(c, viewer)) throw new CampaignHttpError(404, "Not found");
  if (!isPublicVisible(c)) return [];
  const rows = await prisma.comment.findMany({
    where: {
      campaignId: c.id,
      moderationStatus: {
        in: [CommentModerationStatus.PENDING, CommentModerationStatus.VISIBLE],
      },
    },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapComment);
}

export async function addComment(slug: string, userId: string, body: string) {
  const b = body.trim();
  if (!b) throw new CampaignHttpError(400, "body is required");
  const c = await getCampaignRowBySlug(slug);
  if (!isPublicVisible(c)) {
    throw new CampaignHttpError(
      400,
      "Comments are only open on approved, published campaigns.",
    );
  }
  const row = await prisma.comment.create({
    data: {
      campaignId: c.id,
      authorId: userId,
      body: b,
      moderationStatus: CommentModerationStatus.PENDING,
    },
    include: { author: true },
  });
  return mapComment(row);
}

export async function create(
  userId: string,
  dto: {
    title: string;
    description: string;
    imageUrl?: string;
    imageUrls?: string[];
    goalAmount: number;
    recipientName: string;
    recipientNote: string;
    campaignType: string;
  },
): Promise<ApiCampaign> {
  let base = slugify(dto.title);
  let slug = base;
  let n = 0;
  while (await prisma.campaign.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n.toString(36)}`;
  }
  const imgs = normalizeCampaignImages({
    imageUrls: dto.imageUrls,
    imageUrl: dto.imageUrl,
  });
  if (!imgs.length) {
    throw new CampaignHttpError(400, "At least one campaign image is required");
  }

  const c = await prisma.campaign.create({
    data: {
      slug,
      title: dto.title.trim(),
      description: dto.description.trim(),
      imageUrl: imgs[0],
      imageUrls: imgs,
      goalAmount: dto.goalAmount,
      recipientName: dto.recipientName.trim(),
      recipientNote: dto.recipientNote.trim(),
      campaignType: apiCampaignTypeToPrisma(dto.campaignType),
      authorId: userId,
    },
  });
  const full = await prisma.campaign.findUnique({
    where: { id: c.id },
    include: { author: AUTHOR_PUBLIC_SELECT },
  });
  if (!full) throw new CampaignHttpError(404, "Campaign not found");
  return mapCampaign(full);
}

export async function getCampaignUpdates(
  slug: string,
  viewer?: JwtUserPayload,
): Promise<ApiCampaignUpdate[]> {
  const c = await getCampaignRowBySlug(slug);
  if (!canViewCampaign(c, viewer)) throw new CampaignHttpError(404, "Not found");
  const rows = await prisma.campaignUpdate.findMany({
    where: { campaignId: c.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map(mapCampaignUpdate);
}

export async function createCampaignUpdate(
  userId: string,
  campaignId: string,
  dto: { title?: string; body: string; imageUrls?: string[] },
): Promise<ApiCampaignUpdate> {
  const body = dto.body.trim();
  if (!body) throw new CampaignHttpError(400, "body is required");
  const title = (dto.title ?? "").trim().slice(0, 200);
  const imageUrls = (dto.imageUrls ?? [])
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 6);
  const c = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!c) throw new CampaignHttpError(404, "Campaign not found");
  if (c.authorId !== userId) throw new CampaignHttpError(403, "Not your campaign");

  const row = await prisma.campaignUpdate.create({
    data: {
      campaignId: c.id,
      authorId: userId,
      title,
      body,
      imageUrls,
    },
  });
  return mapCampaignUpdate(row);
}

export async function deleteCampaignUpdate(
  userId: string,
  userRole: UserRole,
  campaignId: string,
  updateId: string,
): Promise<void> {
  const row = await prisma.campaignUpdate.findUnique({ where: { id: updateId } });
  if (!row) throw new CampaignHttpError(404, "Update not found");
  if (row.campaignId !== campaignId) {
    throw new CampaignHttpError(400, "Update does not belong to this campaign");
  }
  const c = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!c) throw new CampaignHttpError(404, "Campaign not found");
  const isAdmin = userRole === UserRole.ADMIN;
  const isAuthor = c.authorId === userId;
  if (!isAdmin && !isAuthor) {
    throw new CampaignHttpError(403, "Not allowed to delete this update");
  }
  await prisma.campaignUpdate.delete({ where: { id: updateId } });
}
