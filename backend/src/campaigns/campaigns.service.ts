import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Campaign,
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  CommentModerationStatus,
  DonationVerificationStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtUserPayload } from '../auth/jwt.strategy';
import { mapCampaign, mapComment, mapDonation } from './campaigns.mapper';
import type { ApiCampaign, ApiComment, ApiDonor } from './campaigns.mapper';
import { normalizeCampaignImages } from './campaign-images.util';
import { StripeService } from '../payments/stripe.service';

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return base || 'campaign';
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
  if (viewer.role === 'ADMIN') return true;
  return c.authorId === viewer.sub;
}

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  async listPublic(): Promise<ApiCampaign[]> {
    const rows = await this.prisma.campaign.findMany({
      where: {
        approvalStatus: CampaignApprovalStatus.APPROVED,
        lifecycleStatus: {
          in: [
            CampaignLifecycleStatus.PUBLISHED,
            CampaignLifecycleStatus.DONE,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((c) => mapCampaign(c));
  }

  async listMine(userId: string) {
    const rows = await this.prisma.campaign.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((c) => ({
      ...mapCampaign(c),
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async updateMine(
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
    },
  ): Promise<ApiCampaign> {
    const c = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!c) throw new NotFoundException('Campaign not found');
    if (c.authorId !== userId) throw new ForbiddenException('Not your campaign');

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

    if (c.approvalStatus === CampaignApprovalStatus.REJECTED) {
      data.approvalStatus = CampaignApprovalStatus.PENDING;
      data.lifecycleStatus = CampaignLifecycleStatus.DRAFT;
    }

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data,
    });
    return mapCampaign(updated);
  }

  async getBySlug(slug: string, viewer?: JwtUserPayload): Promise<ApiCampaign> {
    const c = await this.prisma.campaign.findUnique({ where: { slug } });
    if (!c) throw new NotFoundException(`Campaign not found: ${slug}`);
    if (!canViewCampaign(c, viewer)) throw new NotFoundException(`Campaign not found: ${slug}`);
    return mapCampaign(c);
  }

  async create(
    userId: string,
    dto: {
      title: string;
      description: string;
      imageUrl?: string;
      imageUrls?: string[];
      goalAmount: number;
      recipientName: string;
      recipientNote: string;
    },
  ): Promise<ApiCampaign> {
    let base = slugify(dto.title);
    let slug = base;
    let n = 0;
    while (await this.prisma.campaign.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${base}-${n.toString(36)}`;
    }
    const imgs = normalizeCampaignImages({
      imageUrls: dto.imageUrls,
      imageUrl: dto.imageUrl,
    });
    const c = await this.prisma.campaign.create({
      data: {
        slug,
        title: dto.title,
        description: dto.description,
        imageUrl: imgs[0],
        imageUrls: imgs,
        goalAmount: dto.goalAmount,
        raisedAmount: 0,
        lifecycleStatus: CampaignLifecycleStatus.DRAFT,
        approvalStatus: CampaignApprovalStatus.PENDING,
        recipientName: dto.recipientName,
        recipientNote: dto.recipientNote,
        authorId: userId,
      },
    });
    return mapCampaign(c);
  }

  private async getCampaignRowBySlug(slug: string): Promise<Campaign> {
    const c = await this.prisma.campaign.findUnique({ where: { slug } });
    if (!c) throw new NotFoundException(`Campaign not found: ${slug}`);
    return c;
  }

  async getDonors(slug: string, viewer?: JwtUserPayload): Promise<ApiDonor[]> {
    const c = await this.getCampaignRowBySlug(slug);
    if (!canViewCampaign(c, viewer)) throw new NotFoundException();
    const canSeePending =
      !!viewer && (viewer.role === UserRole.ADMIN || viewer.sub === c.authorId);
    const rows = await this.prisma.donation.findMany({
      where: {
        campaignId: c.id,
        ...(!canSeePending ? { verificationStatus: DonationVerificationStatus.VERIFIED } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
    return rows.map(mapDonation);
  }

  async getComments(slug: string, viewer?: JwtUserPayload): Promise<ApiComment[]> {
    const c = await this.getCampaignRowBySlug(slug);
    if (!canViewCampaign(c, viewer)) throw new NotFoundException();
    if (!isPublicVisible(c)) {
      return [];
    }
    const rows = await this.prisma.comment.findMany({
      where: {
        campaignId: c.id,
        moderationStatus: { in: [CommentModerationStatus.PENDING, CommentModerationStatus.VISIBLE] },
      },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapComment);
  }

  async addComment(slug: string, userId: string, body: string): Promise<ApiComment> {
    const b = body.trim();
    if (!b) throw new BadRequestException('body is required');
    const c = await this.getCampaignRowBySlug(slug);
    if (!isPublicVisible(c)) {
      throw new BadRequestException('Comments are only open on approved, published campaigns.');
    }
    const row = await this.prisma.comment.create({
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

  async createDonationCheckoutSession(
    slug: string,
    dto: { donorDisplayName: string; amount: number },
  ): Promise<{ url: string }> {
    const c = await this.getCampaignRowBySlug(slug);
    if (!isPublicVisible(c)) {
      throw new BadRequestException('Donations are only accepted on approved, published campaigns.');
    }
    const url = await this.stripe.createDonationCheckoutSession({
      campaignSlug: c.slug,
      campaignTitle: c.title,
      donorDisplayName: dto.donorDisplayName.trim(),
      amountPhp: dto.amount,
    });
    return { url };
  }

  async createDonationPaymentIntent(
    slug: string,
    dto: { donorDisplayName: string; amount: number },
  ): Promise<{ clientSecret: string }> {
    const c = await this.getCampaignRowBySlug(slug);
    if (!isPublicVisible(c)) {
      throw new BadRequestException('Donations are only accepted on approved, published campaigns.');
    }
    return this.stripe.createDonationPaymentIntent({
      campaignSlug: c.slug,
      campaignTitle: c.title,
      donorDisplayName: dto.donorDisplayName.trim(),
      amountPhp: dto.amount,
    });
  }

  async addDonation(
    slug: string,
    dto: {
      donorDisplayName: string;
      amount: number;
      trackingNumber: string;
      branch: string;
      fundraisingReference: string;
    },
  ): Promise<ApiDonor> {
    const c = await this.getCampaignRowBySlug(slug);
    if (!isPublicVisible(c)) {
      throw new BadRequestException('Donations are only accepted on approved, published campaigns.');
    }
    const d = await this.prisma.donation.create({
      data: {
        campaignId: c.id,
        donorDisplayName: dto.donorDisplayName.trim(),
        amount: dto.amount,
        trackingNumber: dto.trackingNumber,
        branch: dto.branch,
        fundraisingReference: dto.fundraisingReference,
        verificationStatus: DonationVerificationStatus.PENDING,
      },
    });
    return mapDonation(d);
  }
}
