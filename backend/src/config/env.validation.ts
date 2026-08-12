import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Strongly-typed, validated view of process.env. Validation runs at boot so the
 * app fails fast with a clear message when a required variable is missing.
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  // Env vars are always strings; @Type coerces before validation.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  PORT = 4000;

  // --- Database ---
  /** Transaction-mode pooler URL (port 6543). Used by PrismaClient at runtime. */
  @IsString()
  DATABASE_URL!: string;

  /** Session-mode pooler URL (port 5432). Required by prisma migrate / db seed. */
  @IsString()
  @IsOptional()
  DIRECT_URL?: string;

  // --- JWT ---
  @IsString()
  @MinLength(16, {
    message: 'JWT_ACCESS_SECRET must be at least 16 characters',
  })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(16, {
    message: 'JWT_REFRESH_SECRET must be at least 16 characters',
  })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN = '7d';

  // --- CORS / frontend ---
  @IsString()
  @IsOptional()
  CORS_ORIGIN = 'http://localhost:3000';

  // --- Mail (SMTP). Optional: when unset, codes are logged to the console. ---
  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  SMTP_PORT?: number;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD?: string;

  @IsString()
  @IsOptional()
  MAIL_FROM = 'CENTO Admin <no-reply@cento.local>';

  // --- Tenancy ---
  /**
   * Store a storefront request falls back to when it identifies no tenant of
   * its own (no matching domain, no X-Tenant-Slug header, no ?tenant=).
   *
   * Set it to '' in a true multi-tenant deployment so an unidentified request
   * is rejected instead of silently landing in one particular store.
   */
  @IsString()
  @IsOptional()
  TENANT_FALLBACK_SLUG = 'default';

  // --- Bootstrap: the initial super-admin created by the seed script ---
  // Consumed only by prisma/seed.ts. No defaults here on purpose — a hardcoded
  // fallback password would ship inside the build output.
  @IsString()
  @IsOptional()
  ADMIN_EMAIL?: string;

  @IsString()
  @IsOptional()
  ADMIN_PASSWORD?: string;

  @IsString()
  @IsOptional()
  ADMIN_NAME?: string;

  /**
   * Email of the platform operator — a SUPER_ADMIN belonging to no tenant, who
   * creates stores and can act inside any of them via X-Tenant-Slug.
   * Defaults to platform@<domain of ADMIN_EMAIL>. Must differ from ADMIN_EMAIL:
   * a tenant-scoped account with the same address would always win at login.
   */
  @IsString()
  @IsOptional()
  PLATFORM_ADMIN_EMAIL?: string;

  // --- Supabase ---
  @IsString()
  @IsOptional()
  SUPABASE_URL?: string;

  /** Current key names: sb_publishable_… / sb_secret_…  */
  @IsString()
  @IsOptional()
  SUPABASE_PUBLISHABLE_KEY?: string;

  @IsString()
  @IsOptional()
  SUPABASE_SECRET_KEY?: string;

  /** Legacy JWT key names, still accepted as a fallback. */
  @IsString()
  @IsOptional()
  SUPABASE_ANON_KEY?: string;

  @IsString()
  @IsOptional()
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }

  return validated;
}
