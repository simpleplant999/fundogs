import { IsEnum } from 'class-validator';
import { OrganizationMemberRole } from '@prisma/client';

export class UpdateOrgMemberRoleDto {
  @IsEnum(OrganizationMemberRole)
  organizationMemberRole!: OrganizationMemberRole;
}
