import { Role } from '@prisma/client';

/** Every staff role that may access the admin console. */
export const ADMIN_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.MANAGER,
  Role.SUPPORT,
];

/** Roles allowed to mutate catalog/commerce data (excludes read-only SUPPORT). */
export const WRITE_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER];

/** Roles allowed to manage staff accounts and destructive settings. */
export const OWNER_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];
