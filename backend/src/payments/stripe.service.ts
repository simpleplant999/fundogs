import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private client: Stripe | null = null;

  constructor(private readonly config: ConfigService) {}

  private getStripe(): Stripe {
    if (!this.client) {
      const key = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
      if (!key) {
        throw new ServiceUnavailableException(
          'Online card donations are not configured (missing STRIPE_SECRET_KEY).',
        );
      }
      this.client = new Stripe(key, { typescript: true });
    }
    return this.client;
  }

  /** First origin in FRONTEND_ORIGIN (comma-separated allowed). */
  publicFrontendBaseUrl(): string {
    const raw = this.config.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:3000';
    return raw.split(',')[0].trim().replace(/\/+$/, '');
  }

  async createDonationCheckoutSession(opts: {
    campaignSlug: string;
    campaignTitle: string;
    donorDisplayName: string;
    amountPhp: number;
  }): Promise<string> {
    const frontend = this.publicFrontendBaseUrl();
    const slugEnc = encodeURIComponent(opts.campaignSlug);
    const unitAmount = Math.round(opts.amountPhp * 100);
    if (!Number.isFinite(unitAmount) || unitAmount < 1) {
      throw new InternalServerErrorException('Invalid amount for Stripe');
    }
    const session = await this.getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'php',
            unit_amount: unitAmount,
            product_data: {
              name: `Donation — ${opts.campaignTitle}`.slice(0, 120),
            },
          },
        },
      ],
      metadata: {
        campaign_slug: opts.campaignSlug,
        donor_display_name: opts.donorDisplayName.slice(0, 200),
      },
      success_url: `${frontend}/campaigns/${slugEnc}?donated=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontend}/campaigns/${slugEnc}?donated=cancel`,
    });
    if (!session.url) {
      throw new InternalServerErrorException('Stripe did not return a checkout URL');
    }
    return session.url;
  }

  async createDonationPaymentIntent(opts: {
    campaignSlug: string;
    campaignTitle: string;
    donorDisplayName: string;
    amountPhp: number;
  }): Promise<{ clientSecret: string }> {
    const unitAmount = Math.round(opts.amountPhp * 100);
    if (!Number.isFinite(unitAmount) || unitAmount < 1) {
      throw new InternalServerErrorException('Invalid amount for Stripe');
    }
    const pi = await this.getStripe().paymentIntents.create({
      amount: unitAmount,
      currency: 'php',
      automatic_payment_methods: { enabled: true },
      metadata: {
        campaign_slug: opts.campaignSlug,
        donor_display_name: opts.donorDisplayName.slice(0, 200),
      },
      description: `Donation — ${opts.campaignTitle}`.slice(0, 500),
    });
    if (!pi.client_secret) {
      throw new InternalServerErrorException('Stripe did not return a client secret');
    }
    return { clientSecret: pi.client_secret };
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('Stripe webhooks are not configured (missing STRIPE_WEBHOOK_SECRET).');
    }
    return this.getStripe().webhooks.constructEvent(payload, signature, secret);
  }
}
