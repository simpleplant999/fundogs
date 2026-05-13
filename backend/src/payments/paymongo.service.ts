import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PAYMONGO_API = 'https://api.paymongo.com/v1';

export type PaymongoPaymentIntentAttrs = {
  amount: number;
  currency: string;
  status: string;
  client_key?: string;
  metadata?: Record<string, string>;
  next_action?: {
    type?: string;
    code?: { image_url?: string; id?: string; label?: string; amount?: number };
  };
};

function unwrapData<T = Record<string, unknown>>(json: unknown): { id: string; attributes: T } {
  const root = json as { data?: { id?: string; attributes?: T } };
  const id = root.data?.id;
  const attributes = root.data?.attributes;
  if (!id || attributes == null) {
    throw new InternalServerErrorException('Unexpected PayMongo response shape');
  }
  return { id, attributes };
}

function paymongoErrorMessage(json: unknown): string {
  const err = json as { errors?: Array<{ detail?: string }> };
  const d = err.errors?.[0]?.detail;
  return typeof d === 'string' ? d : 'PayMongo request failed';
}

@Injectable()
export class PaymongoService {
  constructor(private readonly config: ConfigService) {}

  private secretKey(): string {
    const sk = this.config.get<string>('PAYMONGO_SECRET_KEY')?.trim();
    if (!sk) {
      throw new ServiceUnavailableException(
        'PayMongo is not configured (missing PAYMONGO_SECRET_KEY).',
      );
    }
    return sk;
  }

  private authHeader(): string {
    const sk = this.secretKey();
    return `Basic ${Buffer.from(`${sk}:`).toString('base64')}`;
  }

  private async request(method: 'GET' | 'POST', path: string, body?: object): Promise<unknown> {
    const res = await fetch(`${PAYMONGO_API}${path}`, {
      method,
      headers: {
        Authorization: this.authHeader(),
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const json = (await res.json().catch(() => ({}))) as unknown;
    if (!res.ok) {
      throw new BadRequestException(paymongoErrorMessage(json));
    }
    return json;
  }

  /** Amount in PayMongo units (1.00 PHP = 100). Minimum 2000 (= PHP 20). */
  amountToPaymongoUnits(amountPhp: number): number {
    return Math.round(amountPhp * 100);
  }

  async createQrDonation(opts: {
    amountPhp: number;
    campaignSlug: string;
    campaignTitle: string;
    donorDisplayName: string;
    billingEmail: string;
    billingPhone: string;
  }): Promise<{ paymentIntentId: string; clientKey: string; qrImageUrl: string }> {
    const units = this.amountToPaymongoUnits(opts.amountPhp);
    if (!Number.isFinite(units) || units < 2000) {
      throw new BadRequestException('PayMongo QR requires at least PHP 20.');
    }
    const desc = `Donation — ${opts.campaignTitle}`.slice(0, 250);
    const meta = {
      campaign_slug: opts.campaignSlug,
      donor_display_name: opts.donorDisplayName.slice(0, 200),
      donation_channel: 'qrph',
    };

    const piJson = await this.request('POST', '/payment_intents', {
      data: {
        attributes: {
          amount: units,
          currency: 'PHP',
          payment_method_allowed: ['qrph'],
          description: desc,
          metadata: meta,
        },
      },
    });
    const pi = unwrapData<PaymongoPaymentIntentAttrs>(piJson);
    const clientKey = pi.attributes.client_key;
    if (!clientKey) {
      throw new InternalServerErrorException('PayMongo did not return client_key on payment intent');
    }

    const pmJson = await this.request('POST', '/payment_methods', {
      data: {
        attributes: {
          type: 'qrph',
          billing: {
            name: opts.donorDisplayName.slice(0, 120),
            email: opts.billingEmail.trim().slice(0, 120),
            phone: opts.billingPhone.trim().slice(0, 32),
            address: {
              line1: 'Fundogs donor',
              city: 'Manila',
              state: 'Metro Manila',
              postal_code: '1000',
              country: 'PH',
            },
          },
          expiry_seconds: 1800,
        },
      },
    });
    const pm = unwrapData(pmJson);

    const attachJson = await this.request('POST', `/payment_intents/${pi.id}/attach`, {
      data: {
        attributes: {
          payment_method: pm.id,
        },
      },
    });
    const attached = unwrapData<PaymongoPaymentIntentAttrs>(attachJson);
    const imageUrl = attached.attributes.next_action?.code?.image_url;
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new InternalServerErrorException('PayMongo did not return a QR image URL after attach');
    }
    return {
      paymentIntentId: pi.id,
      clientKey,
      qrImageUrl: imageUrl,
    };
  }

  /** Card-only intent for test keys (`pk_test_` + PayMongo test cards). Client creates PM and attaches with `client_key`. */
  async createCardDonationIntent(opts: {
    amountPhp: number;
    campaignSlug: string;
    campaignTitle: string;
    donorDisplayName: string;
  }): Promise<{ paymentIntentId: string; clientKey: string }> {
    const sk = this.secretKey();
    if (!sk.startsWith('sk_test_')) {
      throw new BadRequestException('PayMongo card test flow is only available with a test secret key (sk_test_).');
    }
    const units = this.amountToPaymongoUnits(opts.amountPhp);
    if (!Number.isFinite(units) || units < 2000) {
      throw new BadRequestException('PayMongo card requires at least PHP 20.');
    }
    const desc = `Donation — ${opts.campaignTitle}`.slice(0, 250);
    const meta = {
      campaign_slug: opts.campaignSlug,
      donor_display_name: opts.donorDisplayName.slice(0, 200),
      donation_channel: 'card',
    };

    const piJson = await this.request('POST', '/payment_intents', {
      data: {
        attributes: {
          amount: units,
          currency: 'PHP',
          payment_method_allowed: ['card'],
          description: desc,
          metadata: meta,
        },
      },
    });
    const pi = unwrapData<PaymongoPaymentIntentAttrs>(piJson);
    const clientKey = pi.attributes.client_key;
    if (!clientKey) {
      throw new InternalServerErrorException('PayMongo did not return client_key on payment intent');
    }
    return {
      paymentIntentId: pi.id,
      clientKey,
    };
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<{ id: string; attributes: PaymongoPaymentIntentAttrs }> {
    const json = await this.request('GET', `/payment_intents/${encodeURIComponent(paymentIntentId)}`);
    return unwrapData<PaymongoPaymentIntentAttrs>(json);
  }
}
