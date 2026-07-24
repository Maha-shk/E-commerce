# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CENTO is a full-stack e-commerce platform with a NestJS backend API and Next.js 16 frontend. The backend uses Prisma ORM with PostgreSQL, and the frontend follows the App Router pattern with shadcn/ui components.

**Architecture**: Monorepo with `backend/` (NestJS 11) and `frontend/` (Next.js 16 + React 19)

## Development Commands

### Docker (recommended for full-stack development)
```bash
# Start everything (PostgreSQL + backend + frontend)
docker compose up --build

# Run in background
docker compose up -d

# View logs
docker compose logs -f backend

# Stop containers (keeps database volume)
docker compose down

# Stop and wipe database for fresh start
docker compose down -v
```

### Backend (local development, without Docker)
```bash
cd backend
npm install
npx prisma migrate deploy     # Apply database migrations
npm run db:seed               # Create bootstrap super-admin
npm run start:dev             # Run on http://localhost:4000/api
npm run build                 # Production build
npm run lint                  # ESLint
npm run test                  # Unit tests
npm run test:e2e              # End-to-end tests
npm run prisma:studio         # Open Prisma Studio
```

### Frontend (local development)
```bash
cd frontend
npm install
npm run dev                   # Run on http://localhost:3000
npm run build                 # Production build
npm run lint                  # ESLint
```

## Backend Architecture

### Configuration & Boot
- **Environment validation**: All env vars validated at startup via `src/config/env.validation.ts` using class-validator decorators
- **Routes**: All API routes prefixed with `/api` (see `main.ts`)
- **Global pipes**: `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`
- **Global filters/interceptors**: `AllExceptionsFilter`, `LoggingInterceptor`, `TransformInterceptor`
- **Security**: Helmet, CORS with credentials, rate limiting via `@nestjs/throttler` (100 req/60s default)
- **API docs**: Swagger/OpenAPI available at `/api/docs`

### Prisma & Database
- **ORM**: Prisma with PostgreSQL
- **Migrations**: `npm run prisma:migrate` (dev) or `npx prisma migrate deploy` (production)
- **Seed**: `npm run db:seed` creates bootstrap super-admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars)
- **Data persistence**: Docker volume `cento_pgdata` survives container restarts

### Key Directories
- `src/config/` - Environment configuration and validation
- `src/common/dto/` - Shared DTOs (pagination, etc.)
- `src/common/filters/` - Global exception filters
- `src/common/interceptors/` - Logging and response transformation
- `src/prisma/` - Prisma service and module
- `src/health/` - Health check endpoint

## Frontend Architecture

### Next.js 16 Specifics
**⚠️ IMPORTANT**: Next.js 16 has breaking changes from your training data. Before writing any frontend code, read the relevant guide in `frontend/node_modules/next/dist/docs/` to understand new APIs and patterns. Heed all deprecation notices.

### Routing & Structure
- **App Router**: All routes in `frontend/app/`
- **Route groups**: `(auth)` for authentication flows, `admin/` for admin dashboard
- **Admin screens**: `app/admin/` contains the main admin UI (categories, customers, orders, etc.)

### Components
- `components/ui/` - shadcn/ui primitives (button, input, dialog, etc.)
- `components/admin/` - Admin-specific components (AdminShell, AdminSidebar, modals, etc.)
- `components/auth/` - Authentication flow components
- `components/dashboard/` - Dashboard-related components

### Styling & Utilities
- **Tailwind CSS v4**: Using the new v4 syntax
- **Utility**: `lib/utils.ts` exports `cn()` for merging Tailwind classes (clsx + tailwind-merge)
- **Fonts**: Inter (default variable), Poppins (headings) - defined in `app/layout.tsx`

### Key Patterns
- No global state management yet (Phase 3 will add TanStack Query + Zustand)
- Component-level state with React hooks
- Server components where appropriate (Next.js 16 pattern)

## API Integration

### Backend Endpoints
- Base URL: `http://localhost:4000/api`
- Authentication: JWT tokens via httpOnly cookies
- CORS: Credentials enabled for frontend origin

### Default Admin Login
```
email: admin@cento.local
password: ChangeMe123!
```
Change `ADMIN_PASSWORD` in `.env` before production use.

## RBAC & Permissions

The backend uses role-based access control via the `Role` enum:
- `SUPER_ADMIN` - Full access
- `ADMIN` - Administrative access
- `MANAGER` - Management functions
- `SUPPORT` - Customer support
- `CUSTOMER` - Storefront customers

User status: `ACTIVE`, `INACTIVE`, `SUSPENDED`

## Common Gotchas

1. **Next.js 16 APIs**: Always check `node_modules/next/dist/docs/` before using Next.js features - APIs have changed
2. **Environment validation**: Backend will fail fast on missing/invalid env vars - check `.env.example` files
3. **Database persistence**: `docker compose down` keeps data; use `docker compose down -v` to wipe
4. **API prefix**: Backend routes are under `/api` - include when calling from frontend
5. **Prisma migrations**: After schema changes, run `npx prisma migrate deploy` (or `npm run prisma:migrate` in dev)
6. **Seed admin**: Run `npm run db:seed` after fresh database setup to create super-admin
