import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBody,
} from '@nestjs/common';
import { PaymongoWebhookService } from './paymongo-webhook.service';

@Controller('webhooks')
export class PaymongoWebhookController {
  constructor(private readonly paymongoWebhooks: PaymongoWebhookService) {}

  @Post('paymongo')
  @HttpCode(200)
  async handlePaymongo(
    @Headers('paymongo-signature') signature: string | undefined,
    @RawBody() body: Buffer | undefined,
  ) {
    if (!body?.length) throw new BadRequestException('Missing raw body');
    this.paymongoWebhooks.verifySignature(body, signature);
    let json: unknown;
    try {
      json = JSON.parse(body.toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid JSON body');
    }
    await this.paymongoWebhooks.dispatchFromJson(json);
    return { received: true };
  }
}
