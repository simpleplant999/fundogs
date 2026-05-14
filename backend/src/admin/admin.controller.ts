import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { AdminUpdateCampaignDto } from './dto/admin-update-campaign.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateWithdrawalRequestDto } from '../withdrawals/dto/update-withdrawal-request.dto';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly withdrawals: WithdrawalsService,
  ) {}

  @Get('summary')
  summary() {
    return this.admin.getSummary();
  }

  @Get('users')
  listUsers() {
    return this.admin.listUsers();
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.admin.updateUser(id, dto);
  }

  @Get('organizations')
  listOrganizations() {
    return this.admin.listOrganizations();
  }

  @Get('organizations/:id')
  getOrganization(@Param('id') id: string) {
    return this.admin.getOrganizationAdmin(id);
  }

  @Post('organizations')
  createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.admin.createOrganization(dto);
  }

  @Patch('organizations/:id')
  updateOrganization(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.admin.updateOrganization(id, dto);
  }

  @Delete('organizations/:id')
  deleteOrganization(@Param('id') id: string) {
    return this.admin.deleteOrganization(id);
  }

  @Post('organizations/:id/regenerate-invite')
  regenerateInvite(@Param('id') id: string) {
    return this.admin.regenerateOrganizationInvite(id);
  }

  @Delete('organizations/:id/members/:userId')
  removeOrganizationMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.admin.removeOrganizationMember(id, userId);
  }

  @Get('campaigns')
  allCampaigns() {
    return this.admin.listAllCampaigns();
  }

  @Get('campaigns/pending')
  pendingCampaigns() {
    return this.admin.listPendingCampaigns();
  }

  @Patch('campaigns/:id/approve')
  approveCampaign(@Param('id') id: string) {
    return this.admin.approveCampaign(id);
  }

  @Patch('campaigns/:id/reject')
  rejectCampaign(@Param('id') id: string) {
    return this.admin.rejectCampaign(id);
  }

  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() dto: AdminUpdateCampaignDto) {
    return this.admin.updateCampaignAdmin(id, dto);
  }

  @Delete('campaigns/:id')
  deleteCampaign(@Param('id') id: string) {
    return this.admin.deleteCampaign(id);
  }

  @Get('withdrawals')
  listWithdrawals() {
    return this.withdrawals.listAdminWithdrawals();
  }

  @Patch('withdrawals/:id')
  updateWithdrawal(@Param('id') id: string, @Body() dto: UpdateWithdrawalRequestDto) {
    return this.withdrawals.updateAdminWithdrawal(id, dto);
  }

  @Get('campaigns/:id/bank-account')
  getCampaignBankAccount(@Param('id') id: string) {
    return this.withdrawals.getAdminCampaignBankAccount(id);
  }

  @Get('comments/pending')
  pendingComments() {
    return this.admin.listPendingComments();
  }

  @Patch('comments/:id')
  moderateComment(@Param('id') id: string, @Body() dto: ModerateCommentDto) {
    return this.admin.moderateComment(id, dto.status);
  }
}
