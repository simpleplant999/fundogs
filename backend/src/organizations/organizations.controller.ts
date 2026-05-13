import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { OrganizationsService } from './organizations.service';
import { UpdateMyOrganizationDto } from './dto/update-my-organization.dto';
import { UpdateOrgMemberRoleDto } from './dto/update-org-member-role.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUserPayload } from '../auth/jwt.strategy';
import {
  orgImagesFileFilter,
  orgImagesMulterStorage,
  publicOrgImageUrl,
} from './organizations-upload.storage';

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

  @Post('profile-photo')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: orgImagesMulterStorage(),
      fileFilter: orgImagesFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadOrgProfilePhoto(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Choose an image file');
    const url = publicOrgImageUrl(req, file.filename);
    return this.orgs.setOrgProfilePhotoUrl(user.sub, url);
  }

  @Post('cover-photo')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: orgImagesMulterStorage(),
      fileFilter: orgImagesFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadOrgCoverPhoto(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Choose an image file');
    const url = publicOrgImageUrl(req, file.filename);
    return this.orgs.setOrgCoverPhotoUrl(user.sub, url);
  }

  @Post('gallery-photos')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FilesInterceptor('files', 12, {
      storage: orgImagesMulterStorage(),
      fileFilter: orgImagesFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadOrgGalleryPhotos(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    if (!files?.length) throw new BadRequestException('Add at least one image');
    await this.orgs.getMineForEdit(user.sub);
    const urls = files.map((f) => publicOrgImageUrl(req, f.filename));
    return { urls };
  }
}
