import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/paginated-response';
import { ADMIN_ROLES } from '../common/constants/roles.constants';
import { initialsOf } from '../customers/customers.service';
import {
  CreateStaffDto,
  StaffQueryDto,
  UpdateProfileDto,
  UpdateStaffDto,
} from './dto/user.dto';

const BCRYPT_ROUNDS = 12;

const PROFILE_SELECT = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  status: true,
  emailVerified: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

/** Human-readable role labels used by the profile screen. */
const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  SUPPORT: 'Support Agent',
  CUSTOMER: 'Customer',
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Signed-in user's own profile ---------------------------------------

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');

    const activeSessions = await this.prisma.refreshToken.count({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    return {
      ...user,
      initials: initialsOf(user.fullName),
      roleLabel: ROLE_LABELS[user.role],
      username: user.email.split('@')[0],
      accountSecurity: securityScore(user.emailVerified, activeSessions),
      activeSessions,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const clash = await this.prisma.user.findFirst({
        where: { email: dto.email.toLowerCase().trim(), NOT: { id: userId } },
        select: { id: true },
      });
      if (clash) throw new BadRequestException('That email is already in use');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        // Changing the email forces re-verification.
        ...(dto.email && {
          email: dto.email.toLowerCase().trim(),
          emailVerified: false,
        }),
      },
      select: PROFILE_SELECT,
    });

    return {
      ...user,
      initials: initialsOf(user.fullName),
      roleLabel: ROLE_LABELS[user.role],
    };
  }

  /** Active sessions for the security section of the profile screen. */
  async listSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        expiresAt: true,
      },
    });
    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!count) throw new NotFoundException('Session not found');
    return { message: 'Session revoked' };
  }

  // --- Staff management ----------------------------------------------------

  async findStaff(query: StaffQueryDto) {
    const where: Prisma.UserWhereInput = {
      role: query.role ? { equals: query.role } : { in: ADMIN_ROLES },
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: PROFILE_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = rows.map((u) => ({
      ...u,
      initials: initialsOf(u.fullName),
      roleLabel: ROLE_LABELS[u.role],
    }));

    return paginate(items, total, query.page, query.limit);
  }

  async createStaff(dto: CreateStaffDto) {
    if (dto.role === Role.CUSTOMER) {
      throw new BadRequestException(
        'Use customer registration to create customer accounts',
      );
    }

    const email = dto.email.toLowerCase().trim();
    const clash = await this.prisma.user.findUnique({ where: { email } });
    if (clash) throw new BadRequestException('That email is already in use');

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        role: dto.role,
        status: UserStatus.ACTIVE,
        // Staff accounts are created by an admin, so treat them as verified.
        emailVerified: true,
      },
      select: PROFILE_SELECT,
    });

    return { ...user, initials: initialsOf(user.fullName) };
  }

  async updateStaff(id: string, dto: UpdateStaffDto, actingUserId: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || !ADMIN_ROLES.includes(target.role)) {
      throw new NotFoundException(`Staff member ${id} not found`);
    }

    if (dto.role === Role.CUSTOMER) {
      throw new BadRequestException('A staff member cannot be demoted to CUSTOMER');
    }

    // Guard against an admin locking themselves out.
    if (id === actingUserId && dto.status && dto.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    if (target.role === Role.SUPER_ADMIN && dto.role && dto.role !== Role.SUPER_ADMIN) {
      const remaining = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE, NOT: { id } },
      });
      if (remaining === 0) {
        throw new BadRequestException(
          'Cannot demote the last active super administrator',
        );
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName && { fullName: dto.fullName.trim() }),
        ...(dto.role && { role: dto.role }),
        ...(dto.status && { status: dto.status }),
      },
      select: PROFILE_SELECT,
    });

    // Revoking sessions makes a suspension take effect immediately.
    if (dto.status && dto.status !== UserStatus.ACTIVE) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { ...user, initials: initialsOf(user.fullName) };
  }

  async removeStaff(id: string, actingUserId: string) {
    if (id === actingUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || !ADMIN_ROLES.includes(target.role)) {
      throw new NotFoundException(`Staff member ${id} not found`);
    }

    if (target.role === Role.SUPER_ADMIN) {
      const remaining = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE, NOT: { id } },
      });
      if (remaining === 0) {
        throw new BadRequestException(
          'Cannot delete the last active super administrator',
        );
      }
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: 'Staff member removed' };
  }
}

/** Rough 0-100 completeness score shown on the profile screen. */
function securityScore(emailVerified: boolean, activeSessions: number): number {
  let score = 60;
  if (emailVerified) score += 32;
  if (activeSessions <= 3) score += 8;
  return Math.min(100, score);
}
