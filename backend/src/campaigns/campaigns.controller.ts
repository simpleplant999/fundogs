import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateDonationCheckoutDto } from './dto/create-donation-checkout.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { CreatePaymongoQrDto } from './dto/create-paymongo-qr.dto';
import { SyncStripeCheckoutDto } from './dto/sync-stripe-checkout.dto';
import { SyncStripePaymentIntentDto } from './dto/sync-stripe-payment-intent.dto';
import { SyncPaymongoIntentDto } from './dto/sync-paymongo-intent.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UpsertCampaignBankAccountDto } from '../withdrawals/dto/upsert-campaign-bank-account.dto';
import { CreateWithdrawalRequestDto } from '../withdrawals/dto/create-withdrawal-request.dto';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUserPayload } from '../auth/jwt.strategy';
import {
  campaignImagesFileFilter,
  campaignImagesMulterStorage,
  publicCampaignImageUrl,
} from './campaigns-upload.storage';

@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaigns: CampaignsService,
    private readonly withdrawals: WithdrawalsService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  listMine(@CurrentUser() user: JwtUserPayload) {
    return this.campaigns.listMine(user.sub);
  }

  @Patch('me/:id')
  @UseGuards(AuthGuard('jwt'))
  updateMine(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaigns.updateMine(user.sub, id, dto);
  }

  @Get('me/:id/bank-account')
  @UseGuards(AuthGuard('jwt'))
  getMyBankAccount(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.withdrawals.getCreatorBankAccount(user.sub, id);
  }

  @Patch('me/:id/bank-account')
  @UseGuards(AuthGuard('jwt'))
  upsertMyBankAccount(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() dto: UpsertCampaignBankAccountDto,
  ) {
    return this.withdrawals.upsertCreatorBankAccount(user.sub, id, dto);
  }

  @Get('me/:id/withdrawals')
  @UseGuards(AuthGuard('jwt'))
  listMyWithdrawals(@CurrentUser() user: JwtUserPayload, @Param('id') id: string) {
    return this.withdrawals.listCreatorWithdrawals(user.sub, id);
  }

  @Post('me/:id/withdrawals')
  @UseGuards(AuthGuard('jwt'))
  createMyWithdrawal(
    @CurrentUser() user: JwtUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateWithdrawalRequestDto,
  ) {
    return this.withdrawals.createCreatorWithdrawal(user.sub, id, dto);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateCampaignDto) {
    return this.campaigns.create(user.sub, {
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      imageUrls: dto.imageUrls,
      goalAmount: dto.goalAmount,
      recipientName: dto.recipientName,
      recipientNote: dto.recipientNote,
    });
  }

  @Post('images')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FilesInterceptor('files', 12, {
      storage: campaignImagesMulterStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: campaignImagesFileFilter,
    }),
  )
  uploadCampaignImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    if (!files?.length) throw new BadRequestException('Add at least one image');
    return {
      urls: files.map((f) => publicCampaignImageUrl(req, f.filename)),
    };
  }

  @Get()
  list() {
    return this.campaigns.listPublic();
  }

  @Get(':slug')
  @UseGuards(OptionalJwtGuard)
  getOne(@Param('slug') slug: string, @Req() req: Request & { user?: JwtUserPayload }) {
    return this.campaigns.getBySlug(slug, req.user);
  }

  @Get(':slug/donors')
  @UseGuards(OptionalJwtGuard)
  donors(@Param('slug') slug: string, @Req() req: Request & { user?: JwtUserPayload }) {
    return this.campaigns.getDonors(slug, req.user);
  }

  @Get(':slug/comments')
  @UseGuards(OptionalJwtGuard)
  comments(@Param('slug') slug: string, @Req() req: Request & { user?: JwtUserPayload }) {
    return this.campaigns.getComments(slug, req.user);
  }

  @Post(':slug/comments')
  @UseGuards(AuthGuard('jwt'))
  postComment(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return this.campaigns.addComment(slug, user.sub, dto.body);
  }

  @Post(':slug/donations/payment-intent')
  postDonationPaymentIntent(@Param('slug') slug: string, @Body() dto: CreateDonationCheckoutDto) {
    return this.campaigns.createDonationPaymentIntent(slug, dto);
  }

  @Post(':slug/donations/checkout')
  postDonationCheckout(@Param('slug') slug: string, @Body() dto: CreateDonationCheckoutDto) {
    return this.campaigns.createDonationCheckoutSession(slug, dto);
  }

  @Post(':slug/donations/sync-checkout')
  syncStripeCheckout(@Param('slug') slug: string, @Body() dto: SyncStripeCheckoutDto) {
    return this.campaigns.syncDonationStripeCheckout(slug, dto.sessionId);
  }

  @Post(':slug/donations/sync-payment-intent')
  syncStripePaymentIntent(@Param('slug') slug: string, @Body() dto: SyncStripePaymentIntentDto) {
    return this.campaigns.syncDonationStripePaymentIntent(slug, dto.paymentIntentId);
  }

  @Post(':slug/donations/paymongo-qr')
  postPaymongoQr(@Param('slug') slug: string, @Body() dto: CreatePaymongoQrDto) {
    return this.campaigns.createPaymongoQrDonation(slug, dto);
  }

  @Post(':slug/donations/paymongo-card')
  postPaymongoCard(@Param('slug') slug: string, @Body() dto: CreatePaymongoQrDto) {
    return this.campaigns.createPaymongoCardDonation(slug, dto);
  }

  @Post(':slug/donations/sync-paymongo')
  syncPaymongo(@Param('slug') slug: string, @Body() dto: SyncPaymongoIntentDto) {
    return this.campaigns.syncPaymongoDonation(slug, dto.paymentIntentId);
  }

  @Post(':slug/donations')
  postDonation(@Param('slug') slug: string, @Body() dto: CreateDonationDto) {
    return this.campaigns.addDonation(slug, {
      donorDisplayName: dto.donorDisplayName,
      amount: dto.amount,
      trackingNumber: dto.trackingNumber,
      branch: dto.branch,
      fundraisingReference: dto.fundraisingReference,
    });
  }
}
