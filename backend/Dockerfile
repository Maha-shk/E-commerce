# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Multi-stage build for the NestJS backend.
# Base image is Debian-slim so the Prisma query engine (debian-openssl-3.0.x)
# works without extra native deps.
# ---------------------------------------------------------------------------

# ---- deps: install all dependencies (incl. dev) for building ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
# Use npm ci when a lockfile is present (reproducible); fall back to install.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---- build: compile TypeScript + generate the Prisma client ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# Dev dependencies are kept so `prisma db seed` (ts-node) can run at startup.

# ---- runtime: minimal image that runs the compiled app ----
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./
COPY --from=build /app/tsconfig*.json ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000
# Entrypoint applies pending migrations (and seeds on first run) before starting.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
