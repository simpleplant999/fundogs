import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

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

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsBoolean()
  hideAmount?: boolean;
}
