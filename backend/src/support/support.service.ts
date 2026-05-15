import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  CampaignType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymongoService } from '../payments/paymongo.service';
import { PaymongoWebhookService } from '../payments/paymongo-webhook.service';
import { PLATFORM_SUPPORT_CAMPAIGN_SLUG } from './platform-support.constants';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymongo: PaymongoService,
    private readonly paymongoWebhooks: PaymongoWebhookService,
  ) {}

  private async ensurePlatformSupportCampaign() {
    const existing = await this.prisma.campaign.findUnique({
      where: { slug: PLATFORM_SUPPORT_CAMPAIGN_SLUG },
    });
    if (existing) return existing;

    const admin = await this.prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
      orderBy: { createdAt: 'asc' },
    });
    if (!admin) {
      throw new ServiceUnavailableException(
        'Platform support is not ready yet (no admin account).',
      );
    }

    return this.prisma.campaign.create({
      data: {
        slug: PLATFORM_SUPPORT_CAMPAIGN_SLUG,
        title: 'FunDogs platform support',
        description:
          'Contributions that keep FunDogs online and help us reach more animals in need.',
        imageUrl:
          'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80',
        goalAmount: 1_000_000,
        raisedAmount: 0,
        lifecycleStatus: CampaignLifecycleStatus.PUBLISHED,
        approvalStatus: CampaignApprovalStatus.APPROVED,
        recipientName: 'FunDogs',
        recipientNote: 'Platform operations and animal rescue support.',
        authorId: admin.id,
        campaignType: CampaignType.OTHER,
      },
    });
  }

  async createPaymongoQrDonation(dto: {
    donorDisplayName: string;
    amount: number;
    billingEmail?: string;
    billingPhone?: string;
    hideAmount?: boolean;
  }): Promise<{ paymentIntentId: string; clientKey: string; qrImageUrl: string }> {
    const campaign = await this.ensurePlatformSupportCampaign();
    const email =
      dto.billingEmail?.trim() ||
      `donors+${encodeURIComponent(campaign.slug).slice(0, 48)}@example.com`;
    const phone = (dto.billingPhone?.replace(/\s+/g, '') || '09171234567').slice(0, 20);
    return this.paymongo.createQrDonation({
      amountPhp: dto.amount,
      campaignSlug: campaign.slug,
      campaignTitle: campaign.title,
      donorDisplayName: dto.donorDisplayName.trim(),
      billingEmail: email,
      billingPhone: phone,
      hideAmountPublic: dto.hideAmount === true,
    });
  }

  async createPaymongoCardDonation(dto: {
    donorDisplayName: string;
    amount: number;
    hideAmount?: boolean;
  }): Promise<{ paymentIntentId: string; clientKey: string }> {
    const campaign = await this.ensurePlatformSupportCampaign();
    return this.paymongo.createCardDonationIntent({
      amountPhp: dto.amount,
      campaignSlug: campaign.slug,
      campaignTitle: campaign.title,
      donorDisplayName: dto.donorDisplayName.trim(),
      hideAmountPublic: dto.hideAmount === true,
    });
  }

  async syncPaymongoDonation(
    paymentIntentId: string,
  ): Promise<{ recorded: boolean; alreadyRecorded: boolean; status: string }> {
    let row: Awaited<ReturnType<PaymongoService['retrievePaymentIntent']>>;
    try {
      row = await this.paymongo.retrievePaymentIntent(paymentIntentId);
    } catch {
      throw new BadRequestException('Could not retrieve PayMongo payment intent.');
    }
    const metaSlug = row.attributes.metadata?.campaign_slug?.trim();
    if (!metaSlug || metaSlug !== PLATFORM_SUPPORT_CAMPAIGN_SLUG) {
      throw new BadRequestException('This payment does not belong to platform support.');
    }
    const outcome = await this.paymongoWebhooks.recordDonationIfSucceededIntent({
      paymentIntentId: row.id,
    });
    return {
      status: row.attributes.status,
      recorded: outcome === 'created',
      alreadyRecorded: outcome === 'exists',
    };
  }
}
