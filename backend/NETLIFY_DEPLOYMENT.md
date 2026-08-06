# Deploying the CENTO backend to Netlify

The NestJS app runs as a single Netlify Function. Every `/api/*` request is
rewritten to it, and one Supabase Postgres database backs both local development
and the deployed site.

## One-time Netlify setup

### 1. Site settings

Create the site from the GitHub repo, then set:

| Setting | Value |
| --- | --- |
| **Base directory** | `backend` |
| Build command | *(leave blank — read from `netlify.toml`)* |
| Publish directory | *(leave blank — read from `netlify.toml`)* |

**Base directory is the one setting that must be entered manually.** This repo
holds `frontend/` and `backend/` side by side, and Netlify looks for
`netlify.toml` at the base directory. Without it the config below is never read.

### 2. Environment variables

Site configuration → Environment variables. Use the same values as
`backend/.env`, with two changes: `NODE_ENV=production` and a `CORS_ORIGIN`
pointing at the deployed frontend.

```
DATABASE_URL              postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connect_timeout=30
DIRECT_URL                postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=30
SUPABASE_URL              https://<ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY  sb_publishable_...
SUPABASE_SECRET_KEY       sb_secret_...
JWT_ACCESS_SECRET         <long random string, min 16 chars>
JWT_REFRESH_SECRET        <a different long random string>
CORS_ORIGIN               http://localhost:3000,https://pr-e-commerce-seven.vercel.app
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / MAIL_FROM   (optional)
```

### Do NOT set these on Netlify

| Variable | Why |
| --- | --- |
| `PORT` | Only `main.ts` reads it, and the serverless function never binds a port. Setting it also makes the secrets scanner search the build for the literal string `4000`, which matches unrelated code. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Read **only** by `prisma/seed.ts`, which does not run during a Netlify build. Leaving `ADMIN_PASSWORD` set — especially at the default `ChangeMe123!` — puts a well-known admin credential in the deploy environment for no benefit. |
| `NODE_ENV` | Already set in `netlify.toml`. A duplicate UI value adds nothing. |

After this, deploying is just `git push`.

`CORS_ORIGIN` is a comma-separated allowlist with **no trailing slashes** — a
browser's `Origin` header never sends one, so `https://example.com/` can never
match. Credentials are enabled, so `*` is not a legal value either. Note that
Vercel gives every preview deployment its own hostname
(`…-git-<branch>-<team>.vercel.app`); those are not covered by the production
origin and must be added if you need previews to reach this API.

## How the pieces fit

`netlify.toml` drives everything. Four of its settings are load-bearing and easy
to break:

- **`publish = "netlify/public"`** — a static placeholder page. It must never be
  `dist`, because the publish directory is served publicly and `dist` is the
  compiled server.
- **`NPM_FLAGS = "--include=dev"`** — `NODE_ENV=production` makes npm skip
  `devDependencies`, which would remove `@nestjs/cli`, `typescript` and the
  Prisma CLI and fail the build with `nest: not found`.
- **`node_bundler = "nft"`** — traces and copies the require graph instead of
  bundling. esbuild drops the `emitDecoratorMetadata` that NestJS dependency
  injection depends on; the deploy would succeed and then fail at runtime with
  `Nest can't resolve dependencies of ...`.
- **`included_files`** — the Prisma query engine is resolved by path at runtime,
  so tracing cannot see it and it has to be shipped explicitly.

`netlify/functions/api.js` is plain JavaScript that requires the **compiled**
`dist/` output rather than `src/`, for the same decorator-metadata reason. It
also calls the shared `configureApp()` from `src/bootstrap.ts`, so the deployed
API applies the identical validation pipe, exception filter and
`{ success, data }` response envelope as `npm run start:dev`. Editing bootstrap
behaviour in only one entrypoint is what previously let the two diverge.

`netlify/build.sh` runs `prisma generate` → `nest build` → `prisma migrate
deploy`. Netlify installs dependencies before this runs, so there is no install
step. Migrations use `DIRECT_URL`; the build fails fast if it is unset rather
than shipping code whose schema was never applied.

## Secrets scanning

After a successful build, Netlify greps the repo **and** the build output for the
literal value of every configured environment variable, failing the deploy on a
match. Low-entropy values trigger this constantly: with `PORT=4000` set, the
string `4000` matches phone-number examples and `maxLength` validators; with
`NODE_ENV=production`, the word `production` matches this very document.

`netlify.toml` handles it with two narrow settings:

- `SECRETS_SCAN_OMIT_KEYS` — keys whose values are non-secret or deliberately
  public (`NODE_ENV`, `PORT`, `CORS_ORIGIN`, the Supabase *publishable* key, …).
- `SECRETS_SCAN_OMIT_PATHS` — `.env.example` and `*.md`, which contain example
  values on purpose.

The real credentials are **not** on either list and stay scanned: `DATABASE_URL`,
`DIRECT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_PASSWORD`,
`SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD`. If the scanner flags one of those, it
found a genuine leak — remove the value from the repo rather than adding the key
to the omit list. Never reach for `SECRETS_SCAN_ENABLED=false`; that disables the
protection wholesale.

## Database connection strings

Copy both from the Supabase dashboard → **Connect** → **ORMs** → **Prisma**.

Always use the `*.pooler.supabase.com` host. The direct `db.<ref>.supabase.co`
host publishes **only an AAAA (IPv6) record**, and neither a typical home network
nor AWS Lambda — which Netlify Functions run on — can route to it. This is the
real cause of connection failures that look like a firewall or ISP block.

| Variable | Port | Mode | Used by |
| --- | --- | --- | --- |
| `DATABASE_URL` | 6543 | transaction | `PrismaClient` at runtime — serverless-safe, holds no open connection |
| `DIRECT_URL` | 5432 | session | `prisma migrate`, `prisma db seed` — need advisory locks |

Keep `connect_timeout=30` on both. Prisma's 5-second default can expire during
the TLS handshake on a long route and reports it as
`P1001 Can't reach database server`, which reads like the host is wrong when it
is not.

## Verifying a deploy

This backend deploys to **https://pr-e-commerce.netlify.app**, and the frontend
lives at **https://pr-e-commerce-seven.vercel.app**.

```bash
curl https://pr-e-commerce.netlify.app/api/health
```

A healthy response is the `{ "success": true, "data": { "database": "up", … } }`
envelope. Interpreting other outcomes:

| Response | Meaning |
| --- | --- |
| `{"success":true,…,"database":"up"}` | working |
| `502` + `Runtime.ExitError: exit status 1` | the function crashed while booting — almost always a missing env var or a bundler that stripped decorator metadata. Check Netlify → Functions → `api` logs for the real stack trace. |
| `404` on `/api/health` | the redirect never fired — **Base directory** is not set to `backend`, so `netlify.toml` was not read |
| `404` on `/` only | expected before the placeholder page ships; the API is unaffected |
| raw JSON with no `success` wrapper | `configureApp()` did not run in the function |

## Operational limits worth knowing

These are properties of Netlify Functions, not bugs to fix:

- **Timeout** — 10s on Free, 26s on Pro. A cold start plus a slow query can
  approach this.
- **Cold starts** — the whole Nest container boots on the first request after
  idle, typically 1–3s. Warm requests are far faster.
- **Connection pooling** — every concurrent function instance opens its own
  Prisma pool. The transaction pooler on 6543 is what keeps this from exhausting
  Postgres connections; do not point `DATABASE_URL` at port 5432.
- **No background work** — schedulers or long jobs need Netlify Scheduled
  Functions or a separate always-on host.

If the timeout or cold starts become a problem, a long-running host
([Railway](https://railway.app), [Render](https://render.com), Fly.io) runs this
same codebase via `npm run start:prod` with no serverless caveats.

## Local development

```bash
cp .env.example .env    # fill in the real values
npm install             # postinstall runs `prisma generate`
npm run prisma:deploy   # apply migrations
npm run db:seed         # seed data + bootstrap admin
npm run start:dev
```

API on http://localhost:4000/api, Swagger on http://localhost:4000/api/docs.

To exercise the serverless path locally instead, `npm run netlify` proxies on
port 8888 with Nest on 4000.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `nest: not found` during build | `devDependencies` skipped — `NPM_FLAGS="--include=dev"` missing |
| `Nest can't resolve dependencies of ...` at runtime | bundler stripped decorator metadata — `node_bundler` must be `nft`, and the function must require `dist/`, not `src/` |
| `P1001 Can't reach database server` | IPv6-only direct host, or `connect_timeout` too low — use the pooler host with `connect_timeout=30` |
| `P1000 Authentication failed` | wrong database password, or the username is missing the `.{project-ref}` suffix the pooler requires |
| `Module '"@prisma/client"' has no exported member ...` | generated client is stale — run `npx prisma generate` (now automatic via `postinstall`) |
| Responses missing `{ success, data }` | `configureApp()` did not run in the function |
| Config changes appear ignored | **Base directory** is not set to `backend`, so `netlify.toml` was never read |
