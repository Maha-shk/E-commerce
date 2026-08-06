#!/usr/bin/env bash
#
# Netlify build for the NestJS backend.
# Netlify has already run `npm install` by the time this executes, so there is
# no install step here.
set -euo pipefail

echo "→ Generating Prisma client (includes the rhel-openssl-3.0.x Lambda engine)…"
npx prisma generate

echo "→ Compiling NestJS with tsc…"
# Must be tsc (via nest build), not a bundler: NestJS dependency injection reads
# emitDecoratorMetadata, which esbuild does not emit. netlify/functions/api.js
# then requires this compiled output.
npm run build

# Migrations run against DIRECT_URL (session mode, port 5432). The transaction
# pooler on 6543 cannot hold the advisory lock that `migrate deploy` takes.
if [ -n "${DIRECT_URL:-}" ]; then
  echo "→ Applying pending database migrations…"
  npx prisma migrate deploy
else
  echo "✗ DIRECT_URL is not set — refusing to deploy code whose schema may not be applied."
  echo "  Set DIRECT_URL in Netlify → Site configuration → Environment variables."
  exit 1
fi

echo "✓ Build complete."
