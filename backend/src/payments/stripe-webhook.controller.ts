import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBody,
} from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeService } from './stripe.service';

@Controller('webhooks')
export class StripeWebhookController {
  constructor(
    private readonly stripe: StripeService,
    private readonly webhooks: StripeWebhookService,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripe(
    @Headers('stripe-signature') signature: string | undefined,
    @RawBody() body: Buffer | undefined,
  ) {
    if (!signature) throw new BadRequestException('Missing Stripe-Signature header');
    if (!body?.length) throw new BadRequestException('Missing raw body');
    const event = this.stripe.constructWebhookEvent(body, signature);
    await this.webhooks.dispatchVerifiedEvent(event);
    return { received: true };
  }
}
