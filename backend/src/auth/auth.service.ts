import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  Prisma,
  Role,
  User,
  UserStatus,
  VerificationTokenType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { OrdersService } from '../orders/orders.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { JwtRefreshPayload, JwtPayload } from './types/jwt-payload.interface';

const BCRYPT_ROUNDS = 12;
const OTP_TTL_MINUTES = 10;

/**
 * jsonwebtoken types `expiresIn` as a template-literal union (e.g. "15m"), which
 * plain `string` config values don't satisfy. Values are validated at boot.
 */
type ExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

/** Public shape of a user returned by auth endpoints (never includes the hash). */
export const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  status: true,
  emailVerified: true,
  avatarUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly orders: OrdersService,
  ) {}

  // -------------------------------------------------------------------------
  // Registration & email verification
  // -------------------------------------------------------------------------

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('An account with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
      select: USER_PUBLIC_SELECT,
    });

    await this.issueOtp(user.id, user.email, user.fullName, VerificationTokenType.EMAIL_VERIFICATION);

    return {
      message: 'Account created. Check your email for the 6-digit verification code.',
      user,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.requireUserByEmail(dto.email);

    if (user.emailVerified) {
      // If already verified, still return login tokens
      const tokens = await this.issueTokens(user, {});
      return { message: 'Email is already verified.', ...tokens, user: this.toPublicUser(user) };
    }

    await this.consumeOtp(user.id, dto.code, VerificationTokenType.EMAIL_VERIFICATION);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Auto-login after successful email verification
    const tokens = await this.issueTokens(user, {});
    return { message: 'Email verified successfully. You are now logged in.', ...tokens, user: this.toPublicUser(user) };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.requireUserByEmail(dto.email);
    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }
    await this.issueOtp(
      user.id,
      user.email,
      user.fullName,
      VerificationTokenType.EMAIL_VERIFICATION,
    );
    return { message: 'A new verification code has been sent.' };
  }

  // -------------------------------------------------------------------------
  // Login / tokens
  // -------------------------------------------------------------------------

  async login(dto: LoginDto, meta: { userAgent?: string; ip?: string }) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Same generic message whether the email or the password was wrong.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(`Your account is ${user.status.toLowerCase()}`);
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email address before signing in',
      );
    }

    const tokens = await this.issueTokens(user, meta);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  /** Rotates the refresh token: the presented one is revoked and a new pair issued. */
  async refresh(refreshToken: string, meta: { userAgent?: string; ip?: string }) {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.tokenHash !== hashToken(refreshToken)
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is no longer active');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(user, meta);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  /** Revokes a single session. */
  async logout(refreshToken?: string) {
    if (!refreshToken) return { message: 'Signed out.' };
    try {
      const payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.tokenId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // An invalid token is already "logged out" — nothing to do.
    }
    return { message: 'Signed out.' };
  }

  /** Revokes every active session for the user (all devices). */
  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Signed out of all devices.' };
  }

  // -------------------------------------------------------------------------
  // Password reset / change
  // -------------------------------------------------------------------------

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always the same response so the endpoint can't be used to enumerate accounts.
    if (user) {
      await this.issueOtp(
        user.id,
        user.email,
        user.fullName,
        VerificationTokenType.PASSWORD_RESET,
      );
    } else {
      this.logger.warn(`Password reset requested for unknown email: ${email}`);
    }

    return {
      message:
        'If an account exists for that email, a reset code has been sent to it.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.requireUserByEmail(dto.email);

    await this.consumeOtp(user.id, dto.code, VerificationTokenType.PASSWORD_RESET);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS) },
      }),
      // Force re-authentication everywhere after a password change.
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully. You can now sign in.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS) },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password changed. Please sign in again.' };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  /** Get orders for the authenticated customer */
  async getCustomerOrders(userId: string, query: any) {
    // Create a proper query object with customerId
    const orderQuery = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      ...(query.status && { status: query.status }),
      ...(query.search && { search: query.search }),
      ...(query.from && { from: query.from }),
      ...(query.to && { to: query.to }),
      customerId: userId,
    };

    return this.orders.findAll(orderQuery);
  }

  private async issueTokens(user: User, meta: { userAgent?: string; ip?: string }) {
    const tokenId = randomUUID();
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn') as ExpiresIn,
    });

    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn')!;
    const refreshToken = await this.jwt.signAsync(
      { ...payload, tokenId } satisfies JwtRefreshPayload,
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn as ExpiresIn,
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        // SHA-256, not bcrypt: JWTs exceed bcrypt's 72-byte input limit.
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + parseDuration(refreshExpiresIn)),
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    });

    return { accessToken, refreshToken };
  }

  /** Creates a 6-digit code, stores its hash, and emails it. */
  private async issueOtp(
    userId: string,
    email: string,
    name: string,
    type: VerificationTokenType,
  ) {
    // Invalidate any outstanding codes of the same type first.
    await this.prisma.verificationToken.updateMany({
      where: { userId, type, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.prisma.verificationToken.create({
      data: {
        userId,
        type,
        codeHash: await bcrypt.hash(code, BCRYPT_ROUNDS),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      },
    });

    if (type === VerificationTokenType.EMAIL_VERIFICATION) {
      await this.mail.sendVerificationCode(email, name, code);
    } else {
      await this.mail.sendPasswordResetCode(email, name, code);
    }
  }

  /** Validates a submitted code and marks it consumed. Throws if invalid. */
  private async consumeOtp(
    userId: string,
    code: string,
    type: VerificationTokenType,
  ) {
    const token = await this.prisma.verificationToken.findFirst({
      where: { userId, type, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!token || !(await bcrypt.compare(code, token.codeHash))) {
      throw new BadRequestException('The code is invalid or has expired');
    }

    await this.prisma.verificationToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });
  }

  private async requireUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) throw new BadRequestException('The code is invalid or has expired');
    return user;
  }

  private toPublicUser(user: User) {
    const { passwordHash: _passwordHash, updatedAt: _updatedAt, ...rest } = user;
    return rest;
  }
}

/** SHA-256 hex digest, used for refresh-token storage. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Converts a duration like "15m" / "7d" / "3600" (seconds) into milliseconds. */
function parseDuration(value: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000; // sensible fallback: 7 days
  const amount = Number(match[1]);
  const unit = match[2] ?? 's';
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * multipliers[unit];
}
