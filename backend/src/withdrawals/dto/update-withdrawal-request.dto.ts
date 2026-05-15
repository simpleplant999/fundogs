import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { WithdrawalRequestStatus } from '@prisma/client';

export class UpdateWithdrawalRequestDto {
  @IsEnum(WithdrawalRequestStatus)
  status!: WithdrawalRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
