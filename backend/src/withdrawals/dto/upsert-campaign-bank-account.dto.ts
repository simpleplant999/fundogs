import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertCampaignBankAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  accountHolderName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  bankName!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(40)
  accountNumber!: string;
}
