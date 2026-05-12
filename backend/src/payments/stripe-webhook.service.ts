import { Injectable, Logger } from '@nestjs/common';
import {
  CampaignApprovalStatus,
  CampaignLifecycleStatus,
  DonationVerificationStatus,
} from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeWebhookService {
  private readonly log = new Logger(StripeWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async dispatchVerifiedEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
          event.created,
        );
        break;
      case 'payment_intent.succeeded':
        await this.onPaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
          event.created,
        );
        break;
      default:
        break;
    }
  }

  private async onPaymentIntentSucceeded(
    pi: Stripe.PaymentIntent,
    eventCreatedSec: number,
  ): Promise<void> {
    if (pi.status !== 'succeeded') return;
    const slug = pi.metadata?.campaign_slug?.trim();
    if (!slug) {
      this.log.error(`payment_intent.succeeded missing campaign_slug: ${pi.id}`);
      return;
    }
    const donorName = (pi.metadata?.donor_display_name || 'Supporter').trim().slice(0, 120);
    if (pi.amount == null) return;
    const amountPhp = pi.amount / 100;

    const existing = await this.prisma.donation.findUnique({
      where: { stripePaymentIntentId: pi.id },
    });
    if (existing) return;

    const campaign = await this.prisma.campaign.findUnique({ where: { slug } });
    if (!campaign) {
      this.log.error(`Campaign not found for slug ${slug} (pi ${pi.id})`);
      return;
    }
    const visible =
      campaign.approvalStatus === CampaignApprovalStatus.APPROVED &&
      (campaign.lifecycleStatus === CampaignLifecycleStatus.PUBLISHED ||
        campaign.lifecycleStatus === CampaignLifecycleStatus.DONE);
    if (!visible) {
      this.log.warn(`Campaign ${slug} not accepting donations; skipping pi ${pi.id}`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const dup = await tx.donation.findUnique({ where: { stripePaymentIntentId: pi.id } });
      if (dup) return;
      await tx.donation.create({
        data: {
          campaignId: campaign.id,
          donorDisplayName: donorName,
          amount: amountPhp,
          stripePaymentIntentId: pi.id,
          trackingNumber: 'stripe',
          branch: 'stripe-element',
          fundraisingReference: pi.id,
          verificationStatus: DonationVerificationStatus.VERIFIED,
          createdAt: new Date(eventCreatedSec * 1000),
        },
      });
      await tx.campaign.update({
        where: { id: campaign.id },
        data: { raisedAmount: { increment: amountPhp } },
      });
    });
  }

  private async onCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
    eventCreatedSec: number,
  ): Promise<void> {
    if (session.payment_status !== 'paid') {
      this.log.warn(`Ignoring checkout session ${session.id} with status ${session.payment_status}`);
      return;
    }
    const slug = session.metadata?.campaign_slug?.trim();
    if (!slug) {
      this.log.error(`checkout.session.completed missing campaign_slug: ${session.id}`);
      return;
    }
    const donorName = (session.metadata?.donor_display_name || 'Supporter').trim().slice(0, 120);
    const amountTotal = session.amount_total;
    if (amountTotal == null) {
      this.log.error(`checkout.session.completed missing amount_total: ${session.id}`);
      return;
    }
    const amountPhp = amountTotal / 100;

    const existing = await this.prisma.donation.findUnique({
      where: { stripeCheckoutSessionId: session.id },
    });
    if (existing) return;

    const campaign = await this.prisma.campaign.findUnique({ where: { slug } });
    if (!campaign) {
      this.log.error(`Campaign not found for slug ${slug} (session ${session.id})`);
      return;
    }
    const visible =
      campaign.approvalStatus === CampaignApprovalStatus.APPROVED &&
      (campaign.lifecycleStatus === CampaignLifecycleStatus.PUBLISHED ||
        campaign.lifecycleStatus === CampaignLifecycleStatus.DONE);
    if (!visible) {
      this.log.warn(`Campaign ${slug} not accepting donations; skipping session ${session.id}`);
      return;
    }

    const pi =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? '';

    await this.prisma.$transaction(async (tx) => {
      const dup = await tx.donation.findUnique({ where: { stripeCheckoutSessionId: session.id } });
      if (dup) return;
      await tx.donation.create({
        data: {
          campaignId: campaign.id,
          donorDisplayName: donorName,
          amount: amountPhp,
          stripeCheckoutSessionId: session.id,
          trackingNumber: 'stripe',
          branch: 'stripe',
          fundraisingReference: pi,
          verificationStatus: DonationVerificationStatus.VERIFIED,
          createdAt: new Date(eventCreatedSec * 1000),
        },
      });
      await tx.campaign.update({
        where: { id: campaign.id },
        data: { raisedAmount: { increment: amountPhp } },
      });
    });
  }
}
