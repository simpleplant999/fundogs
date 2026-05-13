import { Body, Controller, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import {
  publicUserProfilePhotoUrl,
  userProfilePhotoFileFilter,
  userProfilePhotoMulterStorage,
} from './auth-upload.storage';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUserPayload } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.fullName, dto.inviteCode);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@CurrentUser() user: JwtUserPayload) {
    return this.auth.getMe(user.sub);
  }

  @Post('me/profile-photo')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: userProfilePhotoMulterStorage(),
      fileFilter: userProfilePhotoFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProfilePhoto(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Choose an image file');
    const url = publicUserProfilePhotoUrl(req, file.filename);
    return this.auth.setProfilePhotoUrl(user.sub, url);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  updateMe(@CurrentUser() user: JwtUserPayload, @Body() dto: UpdateMeDto) {
    return this.auth.updateMe(user.sub, dto);
  }
}
