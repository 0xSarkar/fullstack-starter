
# Fullstack TypeScript SaaS Starter

Don't start a new SaaS project from scratch. Use this starter. You get:

- **Backend**: A fully typed backend with Fastify, PostgreSQL, Kysely, and TypeBox
- **Frontend**: A modern React frontend with Vite, TanStack Router, Shadcn UI, and Zustand
- **Admin UI**: An Admin UI for user management (roles, activate/deactivate)
- **Typesafety**: Typesafety between frontend and backend with shared schemas
- **Auth**: Built-in auth (email/password + Google), user roles, and secure password reset
- **Stripe Integration**: Stripe subscriptions with checkout, billing portal, pricing table, and webhook handling
- **Seeding**: Database seeding scripts for development
- **Migrations**: Database migrations with dbmate and Kysely codegen for DB types
- **Monorepo**: All of this packed in a batteries-included monorepo with pnpm workspaces

Build, iterate, and ship SaaS apps faster. Develop with confidence, avoid boilerplate, and scale features without reinventing the basics.

## Tech stack

- Backend: Fastify 5, TypeBox, Stripe
- Database: PostgreSQL, dbmate, Kysely
- Frontend (SPA): React 19, TanStack Router, Tailwind v4, Shadcn UI, Zustand, Vite
- Shared: TypeScript everywhere, monorepo via pnpm workspaces

## Monorepo layout

```
apps/
	backend/        # Fastify API server (Swagger at /docs)
	frontend/       # App UI (Notes, Auth, Plans)
	admin/          # Admin UI (Users management)
packages/
	shared-schemas/ # Shared TypeBox schemas & TS types
	shared-api/     # Typed API functions for frontend
```

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

See `docs/server/postgres-setup.md` for DB basics and `apps/backend/src/plugins/config.ts` for full backend env schema.

3) Create DB and run migrations and seeds

```bash
pnpm migrate:up
pnpm seed:run
```

This uses dbmate and also generates Kysely DB types (`apps/backend/src/types/database.ts`).

4) Start dev server

```bash
pnpm dev
```

What you get:
- Backend at `http://localhost:3000` (Swagger at `/docs`)
- Frontend at `http://localhost:5173`
- Admin at `http://localhost:5174` (open in incognito or a different browser to avoid auth conflicts)

To test Stripe locally, use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:

```bash
stripe login
stripe listen --forward-to localhost:3000/stripe/webhook
```

## CLI scripts

From the repo root (`package.json`):

- `pnpm dev` — start all packages/apps in parallel
- `pnpm build` — build all packages/apps
- `pnpm typecheck` — TypeScript noEmit check across workspace
- Migrations (backend):
	- `pnpm migrate:new <name>`
	- `pnpm migrate:up` | `pnpm migrate:down` | `pnpm migrate:status`
- Seeding (backend):
  - `pnpm seed:run` — build, then reset and seed dev data
