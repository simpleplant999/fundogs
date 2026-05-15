import { IsNumber, Min } from 'class-validator';

export class CreateWithdrawalRequestDto {
  @IsNumber()
  @Min(1)
  amount!: number;
}
