import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  CommentModerationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapCampaign } from '../campaigns/campaigns.mapper';
import { normalizeCampaignImages } from '../campaigns/campaign-images.util';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listAllCampaigns() {
    const rows = await this.prisma.campaign.findMany({
      include: {
        author: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      ...mapCampaign(r),
      author: r.author,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async listPendingCampaigns() {
    const rows = await this.prisma.campaign.findMany({
      where: { approvalStatus: CampaignApprovalStatus.PENDING },
      include: {
        author: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      ...mapCampaign(r),
      author: r.author,
    }));
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
}
