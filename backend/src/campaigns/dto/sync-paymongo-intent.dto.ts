import { IsString, MinLength } from 'class-validator';

export class SyncPaymongoIntentDto {
  @IsString()
  @MinLength(5)
  paymentIntentId!: string;
}
