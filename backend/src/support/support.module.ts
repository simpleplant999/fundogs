import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [PaymentsModule],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
