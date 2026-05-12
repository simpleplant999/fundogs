import { Type } from 'class-transformer';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateDonationDto {
  @IsString()
  @MinLength(1)
  donorDisplayName!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  trackingNumber!: string;

  @IsString()
  branch!: string;

  @IsString()
  fundraisingReference!: string;
}
