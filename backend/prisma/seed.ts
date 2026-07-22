/**
 * Database seed. Idempotent: safe to run on every container start.
 *
 * Phase 1 seeds only the bootstrap super-admin so you can log into the admin
 * console immediately. Phase 2 extends this with demo catalog/orders/etc.
 *
 * Run manually:  npx prisma db seed
 */
import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@cento.local';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const name = process.env.ADMIN_NAME ?? 'Alessandro Cento';

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {}, // Never overwrite an existing admin's password on re-seed.
    create: {
      email,
      passwordHash,
      fullName: name,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  console.log(
    `[seed] Super-admin ready: ${admin.email} (${initials(admin.fullName)}) — role ${admin.role}`,
  );
}

main()
  .catch((e) => {
    console.error('[seed] Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
