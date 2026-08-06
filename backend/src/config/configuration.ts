/**
 * Namespaced config object exposed via ConfigService.get('...').
 * Values are read from the already-validated environment (see env.validation.ts).
 */
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  mail: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : undefined,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM ?? 'CENTO Admin <no-reply@cento.local>',
  },

  // No bootstrapAdmin block here: nothing in the app ever read it, and
  // prisma/seed.ts — the only consumer of ADMIN_* — reads process.env directly.
  // Keeping a copy meant a default admin password sat hardcoded in the bundle.
});
