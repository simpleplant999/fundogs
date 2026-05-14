import { Body, Controller, Post } from '@nestjs/common';
import { CreatePaymongoQrDto } from '../campaigns/dto/create-paymongo-qr.dto';
import { SyncPaymongoIntentDto } from '../campaigns/dto/sync-paymongo-intent.dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('donations/paymongo-qr')
  postPaymongoQr(@Body() dto: CreatePaymongoQrDto) {
    return this.support.createPaymongoQrDonation(dto);
  }

  @Post('donations/paymongo-card')
  postPaymongoCard(@Body() dto: CreatePaymongoQrDto) {
    return this.support.createPaymongoCardDonation(dto);
  }

  @Post('donations/sync-paymongo')
  syncPaymongo(@Body() dto: SyncPaymongoIntentDto) {
    return this.support.syncPaymongoDonation(dto.paymentIntentId);
  }
}
