import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { AuthService, type UploadedImage } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { UpdateMeDto } from './dto/update-profile.dto';

/** Extracts client metadata stored alongside each refresh-token session. */
function requestMeta(req: Request) {
  return { userAgent: req.get('user-agent') ?? undefined, ip: req.ip };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create an account and send a verification code' })
  register(@CurrentTenant('id') tenantId: string, @Body() dto: RegisterDto) {
    return this.auth.register(tenantId, dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Tighter limit than the global one: 10 attempts per minute.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sign in and receive an access + refresh token pair' })
  login(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: LoginDto,
    @Req() req: Request,
  ) {
    return this.auth.login(tenantId, dto, requestMeta(req));
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Confirm the 6-digit email verification code' })
  verifyOtp(@CurrentTenant('id') tenantId: string, @Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(tenantId, dto);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Send a fresh verification code' })
  resendOtp(@CurrentTenant('id') tenantId: string, @Body() dto: ResendOtpDto) {
    return this.auth.resendOtp(tenantId, dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, requestMeta(req));
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Email a password reset code' })
  forgotPassword(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.auth.forgotPassword(tenantId, dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Set a new password using the emailed code' })
  resetPassword(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.auth.resetPassword(tenantId, dto);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the supplied refresh token' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke every active session for the current user' })
  logoutAll(@CurrentUser('id') userId: string) {
    return this.auth.logoutAll(userId);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the signed-in user password' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(userId, dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Return the currently authenticated user' })
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }

  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({ summary: 'Update the signed-in user profile (name/phone/avatar)' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateMeDto) {
    return this.auth.updateMe(userId, dto);
  }

  /**
   * Multipart upload of a profile picture, field name `file`.
   *
   * `PATCH /auth/me` could already set `avatarUrl`, but only to a URL the
   * client had to host itself — there was no way to actually upload an image.
   * Size and MIME are re-checked in the service; the limit here just stops a
   * huge body being buffered in the first place.
   */
  @ApiBearerAuth()
  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a profile picture' })
  uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: UploadedImage,
  ) {
    return this.auth.updateAvatar(userId, file);
  }

  @ApiBearerAuth()
  @Delete('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove the profile picture' })
  removeAvatar(@CurrentUser('id') userId: string) {
    return this.auth.removeAvatar(userId);
  }

  @ApiBearerAuth()
  @Get('orders')
  @ApiOperation({ summary: 'Get the authenticated customer\'s orders (paginated)' })
  getCustomerOrders(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Query() query: any,
  ) {
    return this.auth.getCustomerOrders(tenantId, userId, query);
  }
}
