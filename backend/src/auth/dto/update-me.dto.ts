import { IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;

  @ValidateIf((o) => typeof o.newPassword === 'string' && o.newPassword.length > 0)
  @IsString()
  @MinLength(1)
  currentPassword?: string;

  /** Set to empty string to clear the profile photo URL. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  profilePhotoUrl?: string;
}
