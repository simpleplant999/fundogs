import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreatePaymongoQrDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  donorDisplayName!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(5_000_000)
  amount!: number;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  billingEmail?: string;

  /** PH mobile; defaults if omitted (PayMongo requires billing.phone). */
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  billingPhone?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsBoolean()
  hideAmount?: boolean;
}
