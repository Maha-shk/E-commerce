import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TenantStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser, JwtPayload } from '../types/jwt-payload.interface';

/**
 * Validates the access token and re-checks the user on every request, so a
 * suspended/deleted account loses access immediately instead of at token expiry.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        tenantId: true,
        tenant: { select: { status: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }
    // Suspending a store must lock its staff and customers out immediately,
    // not whenever their current access token happens to expire.
    if (user.tenant && user.tenant.status !== TenantStatus.ACTIVE) {
      throw new UnauthorizedException('This store is suspended');
    }

    // Read from the database, not from the token: moving a user to another
    // tenant then has to take effect on the next request rather than lingering
    // until an old token expires.
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  }
}
