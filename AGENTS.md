# Fullstack Starter Development Guide

## Common Commands

### Development
- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Install Shadcn component in a package: `cd apps/frontend && pnpm dlx shadcn@latest add <component-name>`

### Building
- Build project: `pnpm build`
- Build a package: `pnpm build --filter <package-name>`

### Type Checking
- Run type checks on project: `pnpm run typecheck`
- Run type checks on a package: `pnpm --filter <package-name> run typecheck`

### Migrations
- Create a new, empty migration file: `pnpm migrate:new <migration-name>`
- Apply migrations: `pnpm migrate:up`
- Rollback last migration: `pnpm migrate:down`
- Check migration status: `pnpm migrate:status`

## High-Level Architecture

- **Monorepo Structure**: PNPM workspace with packages and apps separation
- **Full-stack TypeScript**: End-to-end type safety with shared schemas
- **Plugin-based Backend**: Fastify with modular plugin architecture
- **Component-driven Frontend**: React with routing and state management
- **Database-first Design**: PostgreSQL with schema migrations (with dbmate) and type generation (with kysely codegen)

### Core Directories

#### Applications (`apps/`)
- **`backend/`**: Fastify API server with authentication, billing, and CRUD operations
  - `src/plugins/`: Auth, database, JWT, CORS, Stripe integration
  - `src/routes/`: REST API endpoints organized by feature (auth, notes, billing)
  - `db/`: PostgreSQL schema, migrations, and seeds
- **`frontend/`**: Main React application (port 5173)
  - `src/components/`: Shadcn/ui components, auth forms, notes interface
  - `src/routes/`: TanStack Router file-based routing
  - `src/stores/`: Zustand state management (auth, notes)
  - `src/api/`: Type-safe API client functions
- **`admin/`**: Administrative React dashboard (port 5174)
  - Similar structure to frontend with admin-specific features
  - User management

#### Packages (`packages/`)
- **`shared-schemas/`**: Shared TypeScript schemas using TypeBox
  - Auth, billing, notes, and response contracts
  - Ensures type safety between frontend and backend

### Key Architectural Patterns

#### Type-Safe API Contracts
- **Shared Schemas**: TypeBox schemas in `shared-schemas` package
- **Runtime Validation**: Backend validates requests against schemas
- **Frontend Types**: Auto-generated TypeScript types for API responses
- **Code Generation**: Database types generated from PostgreSQL schema

#### Authentication & Authorization
- **JWT-based Auth**: Stateless tokens
- **Multi-provider Support**: Email/password + Google OAuth
- **Role-based Access**: User roles (admin, user) with middleware protection
- **Session Management**: HTTP-only cookies with CSRF protection

#### Database Architecture
- **Migration-driven**: DBMate for version-controlled schema changes
- **Type Generation**: Kysely for type-safe database queries
- **Connection Pooling**: PostgreSQL pool with Fastify decorator
- **Audit Trail**: Created/updated timestamps with triggers

#### Frontend State Management
- **Zustand Stores**: Lightweight state management for auth and features
- **TanStack Router**: File-based routing with nested layouts
- **Data loaders**: Pre-fetching data for routes
- **Component Architecture**: Shadcn/ui with Radix primitives

#### Monorepo Organization
- **Workspace Dependencies**: Cross-package imports with workspace protocol
- **Parallel Development**: Independent dev servers with hot reload
- **Shared Tooling**: Common TypeScript, ESLint, and build configurations
- **Selective Building**: PNPM filtering for targeted builds and tests

### Technology Stack

#### Backend
- **Runtime**: Node.js 18+ with ES modules
- **Framework**: Fastify 5.x with TypeScript
- **Database**: PostgreSQL with Kysely query builder
- **Authentication**: JWT tokens, bcrypt hashing, Google OAuth
- **Validation**: TypeBox schemas with Fastify integration
- **Testing**: Node.js test runner with transaction isolation
- **Infrastructure**: DBMate migrations, Nodemailer, Stripe SDK

#### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Routing**: TanStack Router v1 with file-based routes
- **Styling**: Tailwind CSS 4.x with Shadcn/ui components
- **State**: Zustand for client state, Data Loaders for server state
- **UI Components**: Shadcn/ui, Lucide icons, Sonner notifications
- **Rich Text**: TipTap editor with extensions

#### Development Tools
- **Package Manager**: PNPM with workspace support
- **Type Checking**: TypeScript 5.8+ with strict mode
- **Code Quality**: ESLint, Prettier (implied from project structure)
- **Database Tools**: Kysely codegen, DBMate migrations
- **API Documentation**: Fastify Swagger with auto-generated specs


