import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  CommentModerationStatus,
  OrganizationMemberRole,
  UserRole,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../db";
import { mapCampaign } from "../mappers";
import { generateInviteCode, slugifyOrganizationName } from "../org-code";
import {
  apiCampaignTypeToPrisma,
  tryApiCampaignTypeToPrisma,
} from "../campaign-type";

export class AdminHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

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

export async function listAllCampaigns(campaignTypeFilter?: string) {
  const ct = tryApiCampaignTypeToPrisma(campaignTypeFilter);
  const rows = await prisma.campaign.findMany({
    where: ct !== undefined ? { campaignType: ct } : {},
    include: {
      author: {
        select: {
          id: true,
          email: true,
          fullName: true,
          organization: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => {
    const base = mapCampaign(r);
    return {
      ...base,
      author: r.author
        ? {
            id: r.author.id,
            email: r.author.email,
            fullName: r.author.fullName,
            organization: r.author.organization ?? null,
          }
        : undefined,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

export async function listPendingCampaigns() {
  const rows = await prisma.campaign.findMany({
    where: { approvalStatus: CampaignApprovalStatus.PENDING },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          fullName: true,
          organization: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => {
    const base = mapCampaign(r);
    return {
      ...base,
      author: r.author
        ? {
            id: r.author.id,
            email: r.author.email,
            fullName: r.author.fullName,
            organization: r.author.organization ?? null,
          }
        : undefined,
    };
  });
}

export async function approveCampaign(id: string) {
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) throw new AdminHttpError(404, "Campaign not found");
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      approvalStatus: CampaignApprovalStatus.APPROVED,
      lifecycleStatus: CampaignLifecycleStatus.PUBLISHED,
    },
  });
  return mapCampaign(updated);
}

export async function rejectCampaign(id: string) {
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) throw new AdminHttpError(404, "Campaign not found");
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      approvalStatus: CampaignApprovalStatus.REJECTED,
      lifecycleStatus: CampaignLifecycleStatus.DRAFT,
    },
  });
  return mapCampaign(updated);
}

export async function updateCampaignAdmin(
  id: string,
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
) {
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) throw new AdminHttpError(404, "Campaign not found");
  const data: Prisma.CampaignUpdateInput = {};
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
  if (dto.campaignType !== undefined) data.campaignType = apiCampaignTypeToPrisma(dto.campaignType);
  if (Object.keys(data).length === 0) {
    throw new AdminHttpError(400, "Provide at least one field to update");
  }
  const updated = await prisma.campaign.update({ where: { id }, data });
  return mapCampaign(updated);
}

export async function deleteCampaign(id: string) {
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) throw new AdminHttpError(404, "Campaign not found");

  // Prisma MongoDB does not enforce SQL-style ON DELETE CASCADE — remove dependents first.
  await prisma.comment.deleteMany({ where: { campaignId: id } });
  await prisma.donation.deleteMany({ where: { campaignId: id } });
  await prisma.campaignUpdate.deleteMany({ where: { campaignId: id } });
  await prisma.withdrawalRequest.deleteMany({ where: { campaignId: id } });
  await prisma.campaignBankAccount.deleteMany({ where: { campaignId: id } });
  await prisma.campaign.delete({ where: { id } });

  return { ok: true, id: c.id };
}

export async function listPendingComments() {
  return prisma.comment.findMany({
    where: { moderationStatus: CommentModerationStatus.PENDING },
    include: {
      author: { select: { id: true, email: true, fullName: true } },
      campaign: { select: { id: true, slug: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function moderateComment(id: string, status: "visible" | "rejected") {
  const c = await prisma.comment.findUnique({ where: { id } });
  if (!c) throw new AdminHttpError(404, "Comment not found");
  const moderationStatus =
    status === "visible" ? CommentModerationStatus.VISIBLE : CommentModerationStatus.REJECTED;
  return prisma.comment.update({
    where: { id },
    data: { moderationStatus },
    include: { author: true, campaign: { select: { slug: true, title: true } } },
  });
}

export async function getSummary() {
  const [userCount, organizationCount, campaignCount, contactMessageCount] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.campaign.count(),
    prisma.contactMessage.count(),
  ]);
  return { userCount, organizationCount, campaignCount, contactMessageCount };
}

export async function listUsers() {
  const rows = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organizationMemberRole: true,
      createdAt: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function updateUser(
  id: string,
  dto: {
    role?: UserRole;
    organizationId?: string | null;
    organizationMemberRole?: OrganizationMemberRole;
  },
) {
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) throw new AdminHttpError(404, "User not found");
  const data: Prisma.UserUpdateInput = {};
  if (dto.role !== undefined) data.role = dto.role;

  if (dto.organizationId === null) {
    if (u.organizationId) {
      data.organization = { disconnect: true };
      data.organizationMemberRole = null;
    }
  } else if (dto.organizationId !== undefined && dto.organizationId !== u.organizationId) {
    const org = await prisma.organization.findUnique({ where: { id: dto.organizationId } });
    if (!org) throw new AdminHttpError(400, "Organization not found");
    const others = await prisma.user.count({
      where: { organizationId: dto.organizationId, NOT: { id } },
    });
    const defaultMemberRole =
      others === 0 ? OrganizationMemberRole.ADMIN : OrganizationMemberRole.MEMBER;
    data.organization = { connect: { id: dto.organizationId } };
    data.organizationMemberRole =
      dto.organizationMemberRole !== undefined ? dto.organizationMemberRole : defaultMemberRole;
  } else if (dto.organizationMemberRole !== undefined) {
    if (!u.organizationId) throw new AdminHttpError(400, "User is not in an organization");
    data.organizationMemberRole = dto.organizationMemberRole;
  }

  if (Object.keys(data).length === 0) {
    throw new AdminHttpError(400, "Provide at least one field to update");
  }
  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organizationMemberRole: true,
      createdAt: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });
  return { ...updated, createdAt: updated.createdAt.toISOString() };
}

async function uniqueOrganizationSlug(base: string, excludeId?: string) {
  let slug = base;
  let n = 0;
  for (;;) {
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 20; i += 1) {
    const inviteCode = generateInviteCode();
    const clash = await prisma.organization.findUnique({ where: { inviteCode } });
    if (!clash) return inviteCode;
  }
  throw new AdminHttpError(400, "Could not allocate invite code");
}

export async function listOrganizations() {
  const rows = await prisma.organization.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    bio: r.bio,
    profilePhotoUrl: r.profilePhotoUrl,
    coverPhotoUrl: r.coverPhotoUrl,
    photoUrls: r.photoUrls,
    inviteCode: r.inviteCode,
    memberCount: r._count.members,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getOrganizationAdmin(id: string) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          organizationMemberRole: true,
          createdAt: true,
        },
        orderBy: { fullName: "asc" },
      },
    },
  });
  if (!org) throw new AdminHttpError(404, "Organization not found");
  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
    bio: org.bio,
    profilePhotoUrl: org.profilePhotoUrl,
    coverPhotoUrl: org.coverPhotoUrl,
    photoUrls: org.photoUrls,
    inviteCode: org.inviteCode,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
    members: org.members.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function createOrganization(dto: {
  name: string;
  slug?: string;
  bio?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  photoUrls?: string[];
}) {
  const name = dto.name.trim();
  const slugSource = dto.slug?.trim() ? dto.slug.trim() : name;
  const baseSlug = slugifyOrganizationName(slugSource);
  const slug = await uniqueOrganizationSlug(baseSlug);
  const inviteCode = await uniqueInviteCode();
  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      inviteCode,
      bio: dto.bio?.trim() ?? "",
      profilePhotoUrl: dto.profilePhotoUrl?.trim() ?? "",
      coverPhotoUrl: dto.coverPhotoUrl?.trim() ?? "",
      photoUrls: dto.photoUrls?.filter((u) => u.trim().length > 0) ?? [],
    },
  });
  return getOrganizationAdmin(org.id);
}

export async function updateOrganization(
  id: string,
  dto: {
    name?: string;
    slug?: string;
    bio?: string;
    profilePhotoUrl?: string;
    coverPhotoUrl?: string;
    photoUrls?: string[];
  },
) {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new AdminHttpError(404, "Organization not found");
  const data: Prisma.OrganizationUpdateInput = {};
  if (dto.name !== undefined) data.name = dto.name.trim();
  if (dto.bio !== undefined) data.bio = dto.bio.trim();
  if (dto.profilePhotoUrl !== undefined) data.profilePhotoUrl = dto.profilePhotoUrl.trim();
  if (dto.coverPhotoUrl !== undefined) data.coverPhotoUrl = dto.coverPhotoUrl.trim();
  if (dto.photoUrls !== undefined) {
    data.photoUrls = dto.photoUrls.filter((u) => u.trim().length > 0);
  }
  if (dto.slug !== undefined) {
    const base = slugifyOrganizationName(dto.slug.trim());
    data.slug = await uniqueOrganizationSlug(base, id);
  }
  if (Object.keys(data).length === 0) {
    throw new AdminHttpError(400, "Provide at least one field to update");
  }
  await prisma.organization.update({ where: { id }, data });
  return getOrganizationAdmin(id);
}

export async function deleteOrganization(id: string) {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new AdminHttpError(404, "Organization not found");

  await prisma.user.updateMany({
    where: { organizationId: id },
    data: { organizationId: null, organizationMemberRole: null },
  });
  await prisma.organization.delete({ where: { id } });

  return { ok: true, id: org.id };
}

export async function regenerateOrganizationInvite(id: string) {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new AdminHttpError(404, "Organization not found");
  const inviteCode = await uniqueInviteCode();
  await prisma.organization.update({ where: { id }, data: { inviteCode } });
  return { id, inviteCode };
}

export async function removeOrganizationMember(organizationId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
  });
  if (!user) throw new AdminHttpError(404, "Member not found in this organization");
  await prisma.user.update({
    where: { id: userId },
    data: { organizationId: null, organizationMemberRole: null },
  });
  return { ok: true, userId };
}

export async function listContactMessages() {
  const rows = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    name: r.name,
    email: r.email,
    category: r.category,
    message: r.message,
  }));
}
