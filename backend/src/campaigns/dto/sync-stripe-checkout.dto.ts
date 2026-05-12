import { IsString, MinLength } from 'class-validator';

export class SyncStripeCheckoutDto {
  @IsString()
  @MinLength(10)
  sessionId!: string;
}
