import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationsService } from './organizations.service';
import { UpdateMyOrganizationDto } from './dto/update-my-organization.dto';
import { UpdateOrgMemberRoleDto } from './dto/update-org-member-role.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUserPayload } from '../auth/jwt.strategy';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Get()
  listPublic() {
    return this.orgs.listPublic();
  }

  @Get(':slug/campaigns')
  listCampaignsBySlug(@Param('slug') slug: string) {
    return this.orgs.listPublicCampaignsByOrgSlug(slug);
  }

  @Get(':slug/members')
  listMembersBySlug(@Param('slug') slug: string) {
    return this.orgs.listPublicMembersByOrgSlug(slug);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.orgs.findPublicBySlug(slug);
  }
}

@Controller('organization-membership')
export class OrganizationMembershipController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Get('members')
  @UseGuards(AuthGuard('jwt'))
  listMembers(@CurrentUser() user: JwtUserPayload) {
    return this.orgs.listMembersForOrgAdmin(user.sub);
  }

  @Patch('members/:userId')
  @UseGuards(AuthGuard('jwt'))
  updateMemberRole(
    @CurrentUser() user: JwtUserPayload,
    @Param('userId') userId: string,
    @Body() dto: UpdateOrgMemberRoleDto,
  ) {
    return this.orgs.updateMemberOrgRole(user.sub, userId, dto.organizationMemberRole);
  }

  @Delete('members/:userId')
  @UseGuards(AuthGuard('jwt'))
  removeMember(@CurrentUser() user: JwtUserPayload, @Param('userId') userId: string) {
    return this.orgs.removeMemberFromOrg(user.sub, userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getEditableOrganization(@CurrentUser() user: JwtUserPayload) {
    return this.orgs.getMineForEdit(user.sub);
  }

  @Patch()
  @UseGuards(AuthGuard('jwt'))
  updateEditableOrganization(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: UpdateMyOrganizationDto,
  ) {
    return this.orgs.updateMine(user.sub, dto);
  }
}
