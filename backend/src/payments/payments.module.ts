import { Module } from '@nestjs/common';
import { PaymongoWebhookController } from './paymongo-webhook.controller';
import { PaymongoWebhookService } from './paymongo-webhook.service';
import { PaymongoService } from './paymongo.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeService } from './stripe.service';

@Module({
  controllers: [StripeWebhookController, PaymongoWebhookController],
  providers: [StripeService, StripeWebhookService, PaymongoService, PaymongoWebhookService],
  exports: [StripeService, StripeWebhookService, PaymongoService, PaymongoWebhookService],
})
export class PaymentsModule {}
