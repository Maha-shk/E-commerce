#!/usr/bin/env bash
set -e

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Building NestJS app..."
npm run build

echo "Build complete."