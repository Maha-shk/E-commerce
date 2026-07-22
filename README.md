# CENTO E-commerce

Full-stack e-commerce platform:

- **Frontend** — Next.js 16 (admin dashboard + storefront UI) in [`frontend/`](frontend/)
- **Backend** — NestJS 11 + Prisma + PostgreSQL in [`backend/`](backend/)
- **Database** — PostgreSQL 16 (data persisted in a local Docker volume)

---

## Quick start (Docker — recommended)

Everything runs with a single command. You only need **Docker Desktop** installed.

```bash
# 1. From the repository root, create your env file (safe defaults work out of the box):
cp .env.example .env

# 2. Start the whole stack (Postgres + backend + frontend):
docker compose up --build
```

That's it. On first boot the backend automatically:

1. waits for PostgreSQL to be healthy,
2. applies all database migrations (`prisma migrate deploy`),
3. seeds the bootstrap super-admin (and, from Phase 2, demo data).

Then open:

| Service            | URL                                   |
| ------------------ | ------------------------------------- |
| Frontend           | http://localhost:3000                 |
| Backend API        | http://localhost:4000/api             |
| API docs (Swagger) | http://localhost:4000/api/docs        |
| Health check       | http://localhost:4000/api/health      |

**Default admin login** (change `ADMIN_PASSWORD` in `.env` before any real use):

```
email:    admin@cento.local
password: ChangeMe123!
```

### Common Docker commands

```bash
docker compose up --build        # rebuild and run in the foreground
docker compose up -d             # run detached (background)
docker compose logs -f backend   # tail backend logs
docker compose down              # stop containers (KEEPS the database volume)
docker compose down -v           # stop AND delete the database volume (fresh start)
```

### Data persistence

PostgreSQL data lives in the named Docker volume **`cento_pgdata`**, stored locally
by Docker. It survives `docker compose down` and restarts. Use `docker compose down -v`
only when you want to wipe the database completely.

---

## Configuration

All configuration is driven by environment variables. Two example files document
every variable and where to obtain real values (API keys, SMTP, secrets):

- [`.env.example`](.env.example) — root file read by `docker compose`.
- [`backend/.env.example`](backend/.env.example) — used when running the backend
  directly (outside Docker) with `npm run start:dev`.

Copy each to `.env` and fill in real values. **Never commit `.env`** — it is gitignored.

Key things you may want to set:

- **`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`** — generate with `openssl rand -base64 48`.
- **SMTP\_\*** — optional. If left blank, email verification / password-reset codes are
  printed to the backend container logs (handy for local development). See
  [`backend/.env.example`](backend/.env.example) for Gmail / Mailtrap / SendGrid setup.

---

## Running without Docker (local dev)

Requires Node 22+ and a local PostgreSQL instance.

```bash
# Backend
cd backend
cp .env.example .env          # then edit DATABASE_URL to point at your local Postgres
npm install
npx prisma migrate deploy     # or: npm run prisma:migrate  (creates/updates the DB)
npm run db:seed               # create the bootstrap super-admin
npm run start:dev             # API on http://localhost:4000/api

# Frontend (in another terminal)
cd frontend
npm install
npm run dev                   # app on http://localhost:3000
```

---

## API overview

All routes are served under `/api`. Full interactive docs: **http://localhost:4000/api/docs**.

### Authentication (public)

`POST /api/auth/register` · `login` · `verify-otp` · `resend-otp` · `forgot-password` ·
`reset-password` · `refresh` · `logout`

Authenticated: `GET /api/auth/me`, `POST /api/auth/change-password`, `POST /api/auth/logout-all`.

Login returns a short-lived **access token** and a rotating **refresh token**.
Send the access token as `Authorization: Bearer <token>`.

### Admin (requires a staff role)

| Area          | Base route                 | Highlights                                        |
| ------------- | -------------------------- | ------------------------------------------------- |
| Dashboard     | `/api/admin/dashboard`     | `stats`, `monthly-performance`, `recent-orders`, `top-products` |
| Products      | `/api/admin/products`      | CRUD, search/filter/sort, images & variants        |
| Categories    | `/api/admin/categories`    | CRUD, auto-slug, delete guards                     |
| Inventory     | `/api/admin/inventory`     | list, `stats`, stock `adjust`, audit `history`     |
| Orders        | `/api/admin/orders`        | list/detail, `stats`, guarded status transitions   |
| Customers     | `/api/admin/customers`     | list/detail with lifetime spend, `stats`           |
| Discounts     | `/api/admin/discounts`     | CRUD, derived status, `validate/:code`             |
| Reports       | `/api/admin/reports`       | `?tab=orders\|sales\|products` + date window       |
| Notifications | `/api/admin/notifications` | list, `grouped`, `unread-count`, mark read         |
| Messages      | `/api/admin/messages`      | conversations, replies, unread handling            |
| Settings      | `/api/admin/settings`      | 15 sections with shipped defaults                  |
| Profile       | `/api/admin/profile`       | own profile, active sessions                       |
| Staff         | `/api/admin/staff`         | staff account management (admin/owner only)        |

### Roles (RBAC)

`SUPER_ADMIN` · `ADMIN` · `MANAGER` · `SUPPORT` · `CUSTOMER`

Read access to the admin console requires any staff role. Writes require
`MANAGER` or above; staff management and destructive settings require `ADMIN`+.

---

## Project status

This project is being built in phases:

- **Phase 1 — Backend setup & infrastructure** ✅ (Prisma schema, PostgreSQL,
  config/validation, global error handling, Docker + docker-compose, seeding).
- **Phase 2 — Admin Dashboard backend** ✅ (auth + RBAC, 72 endpoints across 12
  feature modules, validation, guards, interceptors, error handling, demo seed).
- **Phase 3 — Frontend integration** — TanStack Query + Zustand, wiring the UI to the API.
