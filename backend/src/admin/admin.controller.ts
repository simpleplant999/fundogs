import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { AdminUpdateCampaignDto } from './dto/admin-update-campaign.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

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

  @Get('comments/pending')
  pendingComments() {
    return this.admin.listPendingComments();
  }

  @Patch('comments/:id')
  moderateComment(@Param('id') id: string, @Body() dto: ModerateCommentDto) {
    return this.admin.moderateComment(id, dto.status);
  }
}
