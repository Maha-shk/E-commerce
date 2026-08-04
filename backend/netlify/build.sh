#!/bin/bash
# Netlify build script for NestJS backend
# This script runs during Netlify deployment

set -e

echo "🔧 Starting Netlify build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔮 Generating Prisma client..."
npx prisma generate

# Run database migrations (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
  echo "🗄️  Running database migrations..."
  npx prisma migrate deploy
else
  echo "⚠️  DATABASE_URL not set - skipping migrations"
fi

# Build NestJS application
echo "🏗️  Building NestJS application..."
npm run build

# Copy Prisma schema and migration files to output
echo "📋 Copying Prisma files..."
mkdir -p dist/prisma
cp -r prisma/schema.prisma dist/prisma/
if [ -d "prisma/migrations" ]; then
  cp -r prisma/migrations dist/prisma/
fi

echo "✅ Build complete!"
