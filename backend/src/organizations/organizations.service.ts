import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  OrganizationMemberRole,
  Prisma,
} from '@prisma/client';
import { mapCampaign } from '../campaigns/campaigns.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { slugifyOrganizationName } from '../common/org-code.util';
import { mapOrganizationMemberRoleToPublic } from '../common/org-member-role.util';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
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
    if (!org) throw new NotFoundException('Organization not found');
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

  /** Public campaigns whose author belongs to this organization (approved + published/done). */
  async listPublicCampaignsByOrgSlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const rows = await this.prisma.campaign.findMany({
      where: {
        approvalStatus: CampaignApprovalStatus.APPROVED,
        lifecycleStatus: {
          in: [CampaignLifecycleStatus.PUBLISHED, CampaignLifecycleStatus.DONE],
        },
        author: { organizationId: org.id },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            fullName: true,
            organization: { select: { name: true, slug: true } },
          },
        },
      },
    });
    return rows.map((c) => mapCampaign(c));
  }

  /** Public directory of member names (no emails). */
  async listPublicMembersByOrgSlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const members = await this.prisma.user.findMany({
      where: { organizationId: org.id },
      select: { id: true, fullName: true, profilePhotoUrl: true, organizationMemberRole: true },
      orderBy: { fullName: 'asc' },
    });
    return members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      profilePhotoUrl: m.profilePhotoUrl || '',
      organizationMemberRole: mapOrganizationMemberRoleToPublic(m.organizationMemberRole),
    }));
  }

  async listPublic() {
    const rows = await this.prisma.organization.findMany({
      orderBy: { name: 'asc' },
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

  private async uniqueOrganizationSlug(base: string, excludeId?: string) {
    let slug = base;
    let n = 0;
    for (;;) {
      const existing = await this.prisma.organization.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      n += 1;
      slug = `${base}-${n}`;
    }
  }

  private async requireOrgAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
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
      throw new ForbiddenException('You are not a member of an organization');
    }
    if (user.organizationMemberRole !== OrganizationMemberRole.ADMIN) {
      throw new ForbiddenException('Only the organization admin can edit these details');
    }
    return { organizationId: user.organizationId, organization: user.organization };
  }

  /** Any user in an organization (admin or member). */
  private async requireOrgMember(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
      },
    });
    if (!user?.organizationId) {
      throw new ForbiddenException('You are not a member of an organization');
    }
    return { organizationId: user.organizationId };
  }

  async getMineForEdit(userId: string) {
    const { organization } = await this.requireOrgAdmin(userId);
    return organization;
  }

  async updateMine(
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
    const { organizationId } = await this.requireOrgAdmin(userId);
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
      data.slug = await this.uniqueOrganizationSlug(base, organizationId);
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Provide at least one field to update');
    }
    await this.prisma.organization.update({ where: { id: organizationId }, data });
    return this.getMineForEdit(userId);
  }

  async setOrgProfilePhotoUrl(userId: string, url: string) {
    const { organizationId } = await this.requireOrgAdmin(userId);
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { profilePhotoUrl: url.trim() },
    });
    return this.getMineForEdit(userId);
  }

  async setOrgCoverPhotoUrl(userId: string, url: string) {
    const { organizationId } = await this.requireOrgAdmin(userId);
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { coverPhotoUrl: url.trim() },
    });
    return this.getMineForEdit(userId);
  }

  async listMembersForOrgAdmin(actorUserId: string) {
    const { organizationId } = await this.requireOrgMember(actorUserId);
    const members = await this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organizationMemberRole: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
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

  async removeMemberFromOrg(actorUserId: string, memberUserId: string) {
    const { organizationId } = await this.requireOrgAdmin(actorUserId);
    const target = await this.prisma.user.findFirst({
      where: { id: memberUserId, organizationId },
      select: { id: true, organizationMemberRole: true },
    });
    if (!target) throw new NotFoundException('Member not found in this organization');

    if (memberUserId === actorUserId) {
      const adminCount = await this.prisma.user.count({
        where: {
          organizationId,
          organizationMemberRole: OrganizationMemberRole.ADMIN,
        },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Promote another member to organization admin before leaving the organization.',
        );
      }
    }

    await this.prisma.user.update({
      where: { id: memberUserId },
      data: { organizationId: null, organizationMemberRole: null },
    });
    return { ok: true, userId: memberUserId };
  }

  async updateMemberOrgRole(
    actorUserId: string,
    memberUserId: string,
    newRole: OrganizationMemberRole,
  ) {
    const { organizationId } = await this.requireOrgAdmin(actorUserId);
    const target = await this.prisma.user.findFirst({
      where: { id: memberUserId, organizationId },
      select: { id: true, organizationMemberRole: true },
    });
    if (!target) throw new NotFoundException('Member not found in this organization');

    const current =
      target.organizationMemberRole === OrganizationMemberRole.ADMIN
        ? OrganizationMemberRole.ADMIN
        : OrganizationMemberRole.MEMBER;

    if (current === newRole) {
      return { ok: true, userId: memberUserId, organizationMemberRole: newRole };
    }

    if (current === OrganizationMemberRole.ADMIN && newRole === OrganizationMemberRole.MEMBER) {
      const otherAdmins = await this.prisma.user.count({
        where: {
          organizationId,
          organizationMemberRole: OrganizationMemberRole.ADMIN,
          NOT: { id: memberUserId },
        },
      });
      if (otherAdmins < 1) {
        throw new BadRequestException('The organization must keep at least one organization admin.');
      }
    }

    await this.prisma.user.update({
      where: { id: memberUserId },
      data: { organizationMemberRole: newRole },
    });
    return { ok: true, userId: memberUserId, organizationMemberRole: newRole };
  }
}
