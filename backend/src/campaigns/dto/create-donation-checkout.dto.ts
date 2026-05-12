import { Type } from 'class-transformer';
import { IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

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
}
