import { plainToInstance } from 'class-transformer';
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

  @IsInt()
  @Min(1)
  @IsOptional()
  PORT = 4000;

  // --- Database ---
  @IsString()
  DATABASE_URL!: string;

  // --- JWT ---
  @IsString()
  @MinLength(16, { message: 'JWT_ACCESS_SECRET must be at least 16 characters' })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(16, { message: 'JWT_REFRESH_SECRET must be at least 16 characters' })
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

  // --- Bootstrap: the initial super-admin created by the seed script ---
  @IsString()
  @IsOptional()
  ADMIN_EMAIL = 'admin@cento.local';

  @IsString()
  @IsOptional()
  ADMIN_PASSWORD = 'ChangeMe123!';

  @IsString()
  @IsOptional()
  ADMIN_NAME = 'Alessandro Cento';
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
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
