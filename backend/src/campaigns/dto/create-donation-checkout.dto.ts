import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateDonationCheckoutDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  donorDisplayName!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5_000_000)
  amount!: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsBoolean()
  hideAmount?: boolean;
}
