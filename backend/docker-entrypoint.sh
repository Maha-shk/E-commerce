#!/bin/sh
set -e

# Wait for Postgres, apply migrations, seed on first run, then start the app.
# `prisma migrate deploy` applies committed migrations (safe for production).

echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy

# Seed only when SEED_ON_START=true (default in docker-compose for convenience).
if [ "${SEED_ON_START}" = "true" ]; then
  echo "[entrypoint] Seeding database (idempotent)..."
  npx prisma db seed || echo "[entrypoint] Seed step skipped/failed (non-fatal)."
fi

echo "[entrypoint] Starting application: $*"
exec "$@"
