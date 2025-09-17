
# Fullstack TypeScript SaaS Starter

Build, iterate, and ship SaaS apps fast with a batteries-included TypeScript monorepo: fully typed backend (Fastify + PostgreSQL + Kysely), modern React frontends (TanStack Router + Shadcn UI), shared API contracts, and a generated typed API client. Develop with confidence, avoid boilerplate, and scale features without reinventing the basics.

## Why this starter

- Type-safe across the stack: shared TypeBox schemas power runtime validation, OpenAPI docs, and generated client types.
- Real-world auth: email/password + JWT httpOnly cookie, optional Google login, secure password reset, and standardized error shapes.
- Subscriptions ready: Stripe checkout, billing portal, webhook handling, plans in DB, and current subscription exposure to the client.
- Production-minded backend: Fastify plugins, centralized error handling, CORS/Cookie/JWT, env-typed config, Swagger docs at `/docs`.
- DX you’ll love: pnpm monorepo, Vite frontends, nodemon+esbuild dev server, dbmate migrations + Kysely query builder, codegen for clients.
- Admin and App UIs out of the box: user management (roles/activate/deactivate), notes demo, pricing, and auth flows—copy and extend.

## Feature highlights

- Authentication & Accounts
	- Sign up, login, logout, session via httpOnly cookie (`authToken`) or Bearer tokens for mobile apps/CLI
	- Strong password hashing (bcrypt), update password, forgot/reset password with expiring tokens
	- Google social login (optional), safe error semantics, user activation flag
- Authorization & Admin
	- User roles: `user | admin | super_admin`
	- Admin API and UI for listing users and activating/deactivating accounts
- Billing (Stripe)
	- Plans stored in Postgres (`stripe_prices`), checkout sessions, confirm checkout, billing portal
	- Webhook ingestion, subscriptions table with status, and subscription exposure via `/auth/login`/`/auth/me`
- API & Type Safety
	- TypeBox request/response schemas, standardized responses, OpenAPI via Swagger (`/docs` and `/docs/json`)
	- Generated typed client (`@fullstack-starter/api-client`) using `openapi-fetch`
- Data & Migrations
	- Postgres + Kysely query builder, raw SQL migrations (dbmate), Kysely codegen for DB typings
- Frontend
	- React 19 + Vite + TanStack Router + Tailwind v4 + Shadcn UI; Zustand for app state
	- App (customer) and Admin panels scaffolded, with route guards and 401 handling

## Tech stack

- Backend: Fastify 5, @fastify/* plugins (jwt, cookie, cors, swagger), TypeBox, Kysely, dbmate, Stripe, Nodemailer
- Frontend: React 19, TanStack Router, Tailwind v4, Shadcn UI, Zustand, Vite
- Shared: TypeScript everywhere, monorepo via pnpm workspaces

## Monorepo layout

```
apps/
	backend/     # Fastify API server (Swagger at /docs)
	frontend/    # App UI (Notes, Auth, Plans)
	admin/       # Admin UI (Users management)
packages/
	api-schema/  # Shared TypeBox schemas & TS types
	api-client/  # OpenAPI-driven typed client (openapi-fetch)
docs/          # Deep-dive docs (architecture, feature guides)
```

Key paths to skim:
- Backend plugins: `apps/backend/src/plugins/*` (auth, jwt, cookie, config, kysely, swagger, stripe, email)
- Backend routes: `apps/backend/src/routes/*` (auth, notes, billing, admin, stripe webhooks)
- DB schema & migrations: `apps/backend/db/schema.sql`, `apps/backend/db/migrations/*`
- Admin UI: `apps/admin/src/*` (users table, auth store, layouts)
- Frontend UI: `apps/frontend/src/*` (notes, plans, auth pages)
- API schemas: `packages/api-schema/src/*`
- API client: `packages/api-client/*` (codegen script, singleton wrapper)

## Getting started

Prereqs: `Node >= 18`, `pnpm >= 8`, PostgreSQL.

1) Install dependencies

```bash
pnpm install
```

2) Configure environment

- Copy `.env.example` to `.env` (and per-env overrides like `.env.development.local`) in `apps/backend/` root, then set:
	- `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `COOKIE_DOMAIN`, `FRONTEND_URL`
	- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (for billing)
	- Optional: `SMTP_*` for email and `GOOGLE_CLIENT_ID` for Google auth

See `docs/server/postgres-setup.md` for DB basics and `apps/backend/src/plugins/config.ts` for full env schema.

3) Create DB and run migrations

```bash
pnpm migrate:up
```

This uses dbmate and also generates Kysely DB types (`apps/backend/src/types/database.ts`).

4) Start everything in dev

```bash
pnpm dev
```

What you get:
- Backend at `http://localhost:3000` (Swagger at `/docs`)
- Frontend at `http://localhost:5173`
- Admin at `http://localhost:5174`

To run individually:

```bash
pnpm dev:backend
pnpm dev:frontend    # runs both apps/frontends; use app’s own scripts if needed
```

## Development workflow

- Add a route: create a file under `apps/backend/src/routes/<feature>/<name>.ts` and export a `FastifyPluginAsyncTypebox`. Use schema wrappers from `@fullstack-starter/api-schema` for consistent responses. AutoLoad mounts it at `/<feature>/<name>`.
- Query the DB: use `fastify.kysely` with generated types; run `pnpm db:generate-types` after migrations.
- Evolve schema: `pnpm migrate:new <name>` ➜ edit SQL ➜ `pnpm migrate:up` (types regenerate automatically).
- See/try the API: open `http://localhost:3000/docs`.
- Update client types: `pnpm api:codegen` fetches `/docs/json` and regenerates `packages/api-client` types and wrapper.

### Standardized responses

All endpoints respond with one of:
- Success: `{ success: true, data, message? }`
- Error: `{ success: false, error, code?, details? }`
- Paginated: `{ success: true, data: [...], pagination: { page, limit, total, totalPages } }`

Schemas and helpers live in `packages/api-schema/src/response-schema.ts`.

### Auth model at a glance

- JWT signed by `@fastify/jwt`, stored in httpOnly cookie `authToken` for browsers; also returned in JSON for mobile/CLI.
- Helpers: `fastify.authenticate`, `fastify.authenticateOptional`, `fastify.authenticateAdmin`, `reply.setAuthCookie()`, `reply.clearAuthCookie()`.
- Flows: `/auth/signup`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/update-password`, `/auth/google`.

### Stripe subscriptions

- Plans endpoint and DB table (`stripe_prices`), checkout creation, confirmation, billing portal, and webhook handling (`/stripe/webhook`).
- Current subscription data is joined on login/me so clients can render plan state.

## Frontend patterns

- Router-first UI with TanStack Router; file-based routes under `src/routes`.
- Zustand `auth-store` uses typed API client. A global 401 handler (via `@fullstack-starter/api-client` singleton) gracefully resets session and redirects to login.
- Tailwind v4 + Shadcn UI components for accessible, polished UI. The Admin app ships with a data table (TanStack Table) for user management.

## CLI scripts

From the repo root (`package.json`):

- `pnpm dev` — start all packages/apps in parallel
- `pnpm start` — build and run apps
- `pnpm build` — build all packages/apps
- `pnpm test` — run tests across workspace
- `pnpm typecheck` — TypeScript noEmit check across workspace
- Migrations (backend):
	- `pnpm migrate:new <name>`
	- `pnpm migrate:up` | `pnpm migrate:down` | `pnpm migrate:status`
	- `pnpm db:generate-types`
- API client codegen: `pnpm api:codegen`

## Deploy notes

- Set production envs per `config.ts` (cookie domain, JWT expiry, Stripe keys, SMTP, DB URL).
- Behind HTTPS, cookies are `Secure` and `SameSite=none` for cross-subdomain auth.
- Serve frontends separately or from a CDN; point them to the backend via `VITE_API_BASE_URL`.

## License

MIT — use commercially, modify freely. Attribution appreciated.
