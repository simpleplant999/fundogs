import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  CampaignType,
  UserRole,
} from "@prisma/client";
import { prisma } from "../db";
import { PLATFORM_SUPPORT_CAMPAIGN_SLUG } from "../platform-support";
import { PaymentHttpError } from "../payments/errors";
import * as paymongo from "../payments/paymongo";
import { recordDonationIfSucceededIntent } from "../payments/paymongo-webhook";

async function ensurePlatformSupportCampaign() {
  const existing = await prisma.campaign.findUnique({
    where: { slug: PLATFORM_SUPPORT_CAMPAIGN_SLUG },
  });
  if (existing) return existing;

  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) {
    throw new PaymentHttpError(
      503,
      "Platform support is not ready yet (no admin account).",
    );
  }

  return prisma.campaign.create({
    data: {
      slug: PLATFORM_SUPPORT_CAMPAIGN_SLUG,
      title: "FunDogs platform support",
      description:
        "Contributions that keep FunDogs online and help us reach more animals in need.",
      imageUrl:
        "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80",
      goalAmount: 1_000_000,
      raisedAmount: 0,
      lifecycleStatus: CampaignLifecycleStatus.PUBLISHED,
      approvalStatus: CampaignApprovalStatus.APPROVED,
      recipientName: "FunDogs",
      recipientNote: "Platform operations and animal rescue support.",
      authorId: admin.id,
      campaignType: CampaignType.OTHER,
    },
  });
}

export async function createPaymongoQrDonation(dto: {
  donorDisplayName: string;
  amount: number;
  billingEmail?: string;
  billingPhone?: string;
  hideAmount?: boolean;
}): Promise<{ paymentIntentId: string; clientKey: string; qrImageUrl: string }> {
  const campaign = await ensurePlatformSupportCampaign();
  const email =
    dto.billingEmail?.trim() ||
    `donors+${encodeURIComponent(campaign.slug).slice(0, 48)}@example.com`;
  const phone = (dto.billingPhone?.replace(/\s+/g, "") || "09171234567").slice(0, 20);
  return paymongo.createQrDonation({
    amountPhp: dto.amount,
    campaignSlug: campaign.slug,
    campaignTitle: campaign.title,
    donorDisplayName: dto.donorDisplayName.trim(),
    billingEmail: email,
    billingPhone: phone,
    hideAmountPublic: dto.hideAmount === true,
  });
}

export async function createPaymongoCardDonation(dto: {
  donorDisplayName: string;
  amount: number;
  hideAmount?: boolean;
}): Promise<{ paymentIntentId: string; clientKey: string }> {
  const campaign = await ensurePlatformSupportCampaign();
  return paymongo.createCardDonationIntent({
    amountPhp: dto.amount,
    campaignSlug: campaign.slug,
    campaignTitle: campaign.title,
    donorDisplayName: dto.donorDisplayName.trim(),
    hideAmountPublic: dto.hideAmount === true,
  });
}

export async function syncPaymongoDonation(
  paymentIntentId: string,
): Promise<{ recorded: boolean; alreadyRecorded: boolean; status: string }> {
  let row: Awaited<ReturnType<typeof paymongo.retrievePaymentIntent>>;
  try {
    row = await paymongo.retrievePaymentIntent(paymentIntentId);
  } catch {
    throw new PaymentHttpError(400, "Could not retrieve PayMongo payment intent.");
  }
  const metaSlug = row.attributes.metadata?.campaign_slug?.trim();
  if (!metaSlug || metaSlug !== PLATFORM_SUPPORT_CAMPAIGN_SLUG) {
    throw new PaymentHttpError(400, "This payment does not belong to platform support.");
  }
  const outcome = await recordDonationIfSucceededIntent({
    paymentIntentId: row.id,
  });
  return {
    status: row.attributes.status,
    recorded: outcome === "created",
    alreadyRecorded: outcome === "exists",
  };
}
