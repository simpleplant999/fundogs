import { IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { OrganizationMemberRole, UserRole } from '@prisma/client';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @ValidateIf((o: AdminUpdateUserDto) => o.organizationId !== null)
  @IsUUID()
  organizationId?: string | null;

  @IsOptional()
  @IsEnum(OrganizationMemberRole)
  organizationMemberRole?: OrganizationMemberRole;
}
