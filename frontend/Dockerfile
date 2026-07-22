# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Multi-stage build for the Next.js frontend, using `output: "standalone"`.
# ---------------------------------------------------------------------------

# ---- deps: install dependencies ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
# Use npm ci when a lockfile is present (reproducible); fall back to install.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---- build: produce the standalone production build ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# API base URL is baked in at build time for client components (NEXT_PUBLIC_*).
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runtime: minimal image serving the standalone server ----
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
# Standalone output bundles only the files needed to run.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
