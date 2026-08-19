import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  OrganizationMemberRole,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../db";
import { mapCampaign } from "../mappers";
import { slugifyOrganizationName } from "../org-code";
import { mapOrganizationMemberRoleToPublic } from "../org-member-role";

export class OrgHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function findPublicBySlug(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      profilePhotoUrl: true,
      coverPhotoUrl: true,
      photoUrls: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
  });
  if (!org) throw new OrgHttpError(404, "Organization not found");
  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
    bio: org.bio,
    profilePhotoUrl: org.profilePhotoUrl,
    coverPhotoUrl: org.coverPhotoUrl,
    photoUrls: org.photoUrls,
    memberCount: org._count.members,
    createdAt: org.createdAt.toISOString(),
  };
}

export async function listPublicCampaignsByOrgSlug(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!org) throw new OrgHttpError(404, "Organization not found");

  const rows = await prisma.campaign.findMany({
    where: {
      approvalStatus: CampaignApprovalStatus.APPROVED,
      lifecycleStatus: {
        in: [CampaignLifecycleStatus.PUBLISHED, CampaignLifecycleStatus.DONE],
      },
      author: { organizationId: org.id },
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          organization: { select: { name: true, slug: true } },
        },
      },
    },
  });
  return rows.map((c) => mapCampaign(c));
}

export async function listPublicMembersByOrgSlug(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!org) throw new OrgHttpError(404, "Organization not found");

  const members = await prisma.user.findMany({
    where: { organizationId: org.id },
    select: { id: true, fullName: true, profilePhotoUrl: true, organizationMemberRole: true },
    orderBy: { fullName: "asc" },
  });
  return members.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    profilePhotoUrl: m.profilePhotoUrl || "",
    organizationMemberRole: mapOrganizationMemberRoleToPublic(m.organizationMemberRole),
  }));
}

export async function listPublic() {
  const rows = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      profilePhotoUrl: true,
      _count: { select: { members: true } },
    },
  });
  return rows.map((o) => ({
    id: o.id,
    slug: o.slug,
    name: o.name,
    bio: o.bio,
    profilePhotoUrl: o.profilePhotoUrl,
    memberCount: o._count.members,
  }));
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

async function requireOrgAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizationId: true,
      organizationMemberRole: true,
      organization: {
        select: {
          id: true,
          slug: true,
          name: true,
          bio: true,
          profilePhotoUrl: true,
          coverPhotoUrl: true,
          photoUrls: true,
          inviteCode: true,
        },
      },
    },
  });
  if (!user?.organizationId || !user.organization) {
    throw new OrgHttpError(403, "You are not a member of an organization");
  }
  if (user.organizationMemberRole !== OrganizationMemberRole.ADMIN) {
    throw new OrgHttpError(403, "Only the organization admin can edit these details");
  }
  return { organizationId: user.organizationId, organization: user.organization };
}

async function requireOrgMember(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  if (!user?.organizationId) {
    throw new OrgHttpError(403, "You are not a member of an organization");
  }
  return { organizationId: user.organizationId };
}

export async function getMineForEdit(userId: string) {
  const { organization } = await requireOrgAdmin(userId);
  return organization;
}

export async function updateMine(
  userId: string,
  dto: {
    name?: string;
    slug?: string;
    bio?: string;
    profilePhotoUrl?: string;
    coverPhotoUrl?: string;
    photoUrls?: string[];
  },
) {
  const { organizationId } = await requireOrgAdmin(userId);
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
    data.slug = await uniqueOrganizationSlug(base, organizationId);
  }
  if (Object.keys(data).length === 0) {
    throw new OrgHttpError(400, "Provide at least one field to update");
  }
  await prisma.organization.update({ where: { id: organizationId }, data });
  return getMineForEdit(userId);
}

export async function setOrgProfilePhotoUrl(userId: string, url: string) {
  const { organizationId } = await requireOrgAdmin(userId);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { profilePhotoUrl: url.trim() },
  });
  return getMineForEdit(userId);
}

export async function setOrgCoverPhotoUrl(userId: string, url: string) {
  const { organizationId } = await requireOrgAdmin(userId);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { coverPhotoUrl: url.trim() },
  });
  return getMineForEdit(userId);
}

export async function listMembersForOrgAdmin(actorUserId: string) {
  const { organizationId } = await requireOrgMember(actorUserId);
  const members = await prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organizationMemberRole: true,
      createdAt: true,
    },
    orderBy: { fullName: "asc" },
  });
  return members.map((m) => ({
    id: m.id,
    email: m.email,
    fullName: m.fullName,
    platformRole: m.role,
    organizationMemberRole: mapOrganizationMemberRoleToPublic(m.organizationMemberRole),
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function removeMemberFromOrg(actorUserId: string, memberUserId: string) {
  const { organizationId } = await requireOrgAdmin(actorUserId);
  const target = await prisma.user.findFirst({
    where: { id: memberUserId, organizationId },
    select: { id: true, organizationMemberRole: true },
  });
  if (!target) throw new OrgHttpError(404, "Member not found in this organization");

  if (memberUserId === actorUserId) {
    const adminCount = await prisma.user.count({
      where: {
        organizationId,
        organizationMemberRole: OrganizationMemberRole.ADMIN,
      },
    });
    if (adminCount <= 1) {
      throw new OrgHttpError(
        400,
        "Promote another member to organization admin before leaving the organization.",
      );
    }
  }

  await prisma.user.update({
    where: { id: memberUserId },
    data: { organizationId: null, organizationMemberRole: null },
  });
  return { ok: true, userId: memberUserId };
}

export async function updateMemberOrgRole(
  actorUserId: string,
  memberUserId: string,
  newRole: OrganizationMemberRole,
) {
  const { organizationId } = await requireOrgAdmin(actorUserId);
  const target = await prisma.user.findFirst({
    where: { id: memberUserId, organizationId },
    select: { id: true, organizationMemberRole: true },
  });
  if (!target) throw new OrgHttpError(404, "Member not found in this organization");

  const current =
    target.organizationMemberRole === OrganizationMemberRole.ADMIN
      ? OrganizationMemberRole.ADMIN
      : OrganizationMemberRole.MEMBER;

  if (current === newRole) {
    return { ok: true, userId: memberUserId, organizationMemberRole: newRole };
  }

  if (current === OrganizationMemberRole.ADMIN && newRole === OrganizationMemberRole.MEMBER) {
    const otherAdmins = await prisma.user.count({
      where: {
        organizationId,
        organizationMemberRole: OrganizationMemberRole.ADMIN,
        NOT: { id: memberUserId },
      },
    });
    if (otherAdmins < 1) {
      throw new OrgHttpError(400, "The organization must keep at least one organization admin.");
    }
  }

  await prisma.user.update({
    where: { id: memberUserId },
    data: { organizationMemberRole: newRole },
  });
  return { ok: true, userId: memberUserId, organizationMemberRole: newRole };
}
