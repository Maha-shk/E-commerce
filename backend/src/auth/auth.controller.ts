import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  RefreshTokenDto,
  ResetPasswordDto,
} from './dto/password.dto';

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
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Tighter limit than the global one: 10 attempts per minute.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sign in and receive an access + refresh token pair' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, requestMeta(req));
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Confirm the 6-digit email verification code' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Send a fresh verification code' })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.auth.resendOtp(dto);
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
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Set a new password using the emailed code' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
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
  @Get('orders')
  @ApiOperation({ summary: 'Get the authenticated customer\'s orders (paginated)' })
  getCustomerOrders(@CurrentUser('id') userId: string, @Query() query: any) {
    return this.auth.getCustomerOrders(userId, query);
  }
}
