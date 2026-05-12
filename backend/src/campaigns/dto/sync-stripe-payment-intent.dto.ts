import { IsString, MinLength } from 'class-validator';

export class SyncStripePaymentIntentDto {
  @IsString()
  @MinLength(10)
  paymentIntentId!: string;
}
