import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  CommentModerationStatus,
  OrganizationMemberRole,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapCampaign } from '../campaigns/campaigns.mapper';
import { normalizeCampaignImages } from '../campaigns/campaign-images.util';
import { generateInviteCode, slugifyOrganizationName } from '../common/org-code.util';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listAllCampaigns() {
    const rows = await this.prisma.campaign.findMany({
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
      orderBy: { createdAt: 'desc' },
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

  async listPendingCampaigns() {
    const rows = await this.prisma.campaign.findMany({
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
      orderBy: { createdAt: 'asc' },
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

  async approveCampaign(id: string) {
    const c = await this.prisma.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Campaign not found');
    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        approvalStatus: CampaignApprovalStatus.APPROVED,
        lifecycleStatus: CampaignLifecycleStatus.PUBLISHED,
      },
    });
    return mapCampaign(updated);
  }

  async rejectCampaign(id: string) {
    const c = await this.prisma.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Campaign not found');
    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        approvalStatus: CampaignApprovalStatus.REJECTED,
        lifecycleStatus: CampaignLifecycleStatus.DRAFT,
      },
    });
    return mapCampaign(updated);
  }

  async updateCampaignAdmin(
    id: string,
    dto: {
      title?: string;
      description?: string;
      imageUrl?: string;
      imageUrls?: string[];
      goalAmount?: number;
      recipientName?: string;
      recipientNote?: string;
    },
  ) {
    const c = await this.prisma.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Campaign not found');
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
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Provide at least one field to update');
    }
    const updated = await this.prisma.campaign.update({ where: { id }, data });
    return mapCampaign(updated);
  }

  async deleteCampaign(id: string) {
    const c = await this.prisma.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Campaign not found');
    await this.prisma.campaign.delete({ where: { id } });
    return { ok: true, id: c.id };
  }

  async listPendingComments() {
    return this.prisma.comment.findMany({
      where: { moderationStatus: CommentModerationStatus.PENDING },
      include: {
        author: { select: { id: true, email: true, fullName: true } },
        campaign: { select: { id: true, slug: true, title: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async moderateComment(id: string, status: 'visible' | 'rejected') {
    const c = await this.prisma.comment.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Comment not found');
    const moderationStatus =
      status === 'visible'
        ? CommentModerationStatus.VISIBLE
        : CommentModerationStatus.REJECTED;
    return this.prisma.comment.update({
      where: { id },
      data: { moderationStatus },
      include: { author: true, campaign: { select: { slug: true, title: true } } },
    });
  }

  async getSummary() {
    const [userCount, organizationCount, campaignCount, contactMessageCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count(),
      this.prisma.campaign.count(),
      this.prisma.contactMessage.count(),
    ]);
    return { userCount, organizationCount, campaignCount, contactMessageCount };
  }

  async listUsers() {
    const rows = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organizationMemberRole: true,
        createdAt: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async updateUser(
    id: string,
    dto: {
      role?: UserRole;
      organizationId?: string | null;
      organizationMemberRole?: OrganizationMemberRole;
    },
  ) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    const data: Prisma.UserUpdateInput = {};
    if (dto.role !== undefined) data.role = dto.role;

    if (dto.organizationId === null) {
      if (u.organizationId) {
        data.organization = { disconnect: true };
        data.organizationMemberRole = null;
      }
    } else if (
      dto.organizationId !== undefined &&
      dto.organizationId !== u.organizationId
    ) {
      const org = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
      });
      if (!org) throw new BadRequestException('Organization not found');
      const others = await this.prisma.user.count({
        where: { organizationId: dto.organizationId, NOT: { id } },
      });
      const defaultMemberRole =
        others === 0 ? OrganizationMemberRole.ADMIN : OrganizationMemberRole.MEMBER;
      data.organization = { connect: { id: dto.organizationId } };
      data.organizationMemberRole =
        dto.organizationMemberRole !== undefined
          ? dto.organizationMemberRole
          : defaultMemberRole;
    } else if (dto.organizationMemberRole !== undefined) {
      if (!u.organizationId) {
        throw new BadRequestException('User is not in an organization');
      }
      data.organizationMemberRole = dto.organizationMemberRole;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Provide at least one field to update');
    }
    const updated = await this.prisma.user.update({
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

  private async uniqueInviteCode(): Promise<string> {
    for (let i = 0; i < 20; i += 1) {
      const inviteCode = generateInviteCode();
      const clash = await this.prisma.organization.findUnique({ where: { inviteCode } });
      if (!clash) return inviteCode;
    }
    throw new BadRequestException('Could not allocate invite code');
  }

  async listOrganizations() {
    const rows = await this.prisma.organization.findMany({
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
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

  async getOrganizationAdmin(id: string) {
    const org = await this.prisma.organization.findUnique({
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
          orderBy: { fullName: 'asc' },
        },
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
      inviteCode: org.inviteCode,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
      members: org.members.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async createOrganization(dto: {
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
    const slug = await this.uniqueOrganizationSlug(baseSlug);
    const inviteCode = await this.uniqueInviteCode();
    const org = await this.prisma.organization.create({
      data: {
        name,
        slug,
        inviteCode,
        bio: dto.bio?.trim() ?? '',
        profilePhotoUrl: dto.profilePhotoUrl?.trim() ?? '',
        coverPhotoUrl: dto.coverPhotoUrl?.trim() ?? '',
        photoUrls: dto.photoUrls?.filter((u) => u.trim().length > 0) ?? [],
      },
    });
    return this.getOrganizationAdmin(org.id);
  }

  async updateOrganization(
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
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
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
      data.slug = await this.uniqueOrganizationSlug(base, id);
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Provide at least one field to update');
    }
    await this.prisma.organization.update({ where: { id }, data });
    return this.getOrganizationAdmin(id);
  }

  async deleteOrganization(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    await this.prisma.organization.delete({ where: { id } });
    return { ok: true, id: org.id };
  }

  async regenerateOrganizationInvite(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    const inviteCode = await this.uniqueInviteCode();
    await this.prisma.organization.update({ where: { id }, data: { inviteCode } });
    return { id, inviteCode };
  }

  async removeOrganizationMember(organizationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });
    if (!user) throw new NotFoundException('Member not found in this organization');
    await this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: null, organizationMemberRole: null },
    });
    return { ok: true, userId };
  }

  async listContactMessages() {
    const rows = await this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
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
}
