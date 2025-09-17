# Backend Structure and Conventions

## Overview
- **Framework:** Fastify (bootstrapped with Fastify-CLI)
- **Language:** TypeScript
- **Database:** PostgreSQL with hybrid migration/query approach
- **Structure:**
  - `src/` contains main app code
    - `app.ts`: Fastify app entry point
    - `plugins/`: Fastify plugins (e.g., `kysely.ts`, `config.ts`, `sensible.ts`)
    - `routes/`: Route definitions, organized by feature
    - `types/`: Generated TypeScript types (e.g., `database.ts`)
  - `test/`: Test files mirroring `src/` structure
  - `db/migrations/`: Raw SQL migration files managed by dbmate
- **Testing:** Uses pnpm scripts and Node.js test runner

## Key Workflows
- **Database Migrations:**
  - Create new migration: `pnpm migrate:new <migration_name>`
  - Apply migrations: `pnpm migrate:up` (also auto-regenerates types)
  - Rollback migration: `pnpm migrate:down` (also auto-regenerates types)
  - Check migration status: `pnpm migrate:status`
  - Generate TypeScript types: `pnpm db:generate-types`
- **Testing:**
  - Run all tests: `pnpm test:backend`
  - Run a single test file: `pnpm test:backend:file -- path/to/your/testfile.test.ts`
  - Test files are in `test/`, mirroring `src/` structure

## Patterns & Conventions
- **Database Architecture:**
  - **Migrations**: Raw SQL migrations using dbmate in `db/migrations/`
  - **Query Builder**: Kysely for type-safe SQL query building (TypeScript-only, no schema management)
  - **Current DB state & generated types**: Always check `db/schema.sql` to understand the current database schema and the generated types in `src/types/database.ts` (from kysely-codegen) before creating a new feature, writing a migration file, or deciding on any database queries.
  - **Type Generation**: Auto-generated types from database schema using kysely-codegen
  - **Connection**: PostgreSQL via kysely plugin with connection pooling
- **Plugins:**
  - All Fastify plugins are in `src/plugins/` and registered in `app.ts`
  - Use Fastify plugin pattern for encapsulation and reusability
  - When you create a plugin in the `src/plugins/` folder, you do **NOT** need to manually register it in `app.ts`. The app uses Fastify's AutoLoad to automatically load all plugins in the `plugins` directory.
- **Response Standardization:**
  - **Response Format Library**: Centralized response structure through `src/lib/response-format.ts`
  - **Response Helpers**: Use helper functions like `successResponse()`, `errorResponse()`, `emptySuccessResponse()`, `paginatedResponse()`
  - **Schema Wrapping**: Use schema wrappers like `wrapSuccessResponseSchema()`, `wrapErrorResponseSchema()` for TypeBox response schemas
  - **Explicit Status Codes**: Routes explicitly set HTTP status codes using `reply.code(statusCode).send(responseHelper())`
- **Error Handling:**
  - **Error Handler Plugin**: Centralized error handling through `src/plugins/error-handler.ts`
  - **Validation Errors**: Automatic handling of TypeBox validation errors with detailed field information
  - **Fastify Built-in Errors**: Handles Fastify errors (like route not found) with standardized format
- **Routes:**
  - Route files are in `src/routes/`, grouped by feature
  - **Architecture Decision**: Each route is a separate file within a feature folder
    - Example: `src/routes/auth/signup.ts` becomes `POST /auth/signup`
    - Example: `src/routes/auth/login.ts` becomes `POST /auth/login`
    - Each route file contains its own schemas, validation, and logic (self-contained)
    - AutoLoad automatically prefixes routes with the folder name
    - No shared schema files - keep everything related to a route in that route's file
- **Type Safety:**
  - Uses `@sinclair/typebox` for runtime type validation and schemas
  - **Type Providers**: Use `FastifyPluginAsyncTypebox` from `@fastify/type-provider-typebox` for automatic TypeScript type inference on request/response objects
  - **Response Schemas**: Use response schema wrappers like `wrapSuccessResponseSchema()`, `wrapErrorResponseSchema()` for standardized response format
  - Database types auto-generated in `src/types/database.ts`
- **Testing:**
  - Test files are named `*.test.ts` and placed in `test/` with a structure that mirrors `src/`

## Integration & Dependencies
- **External:**
  - Fastify and its plugins
  - `@sinclair/typebox` for schema validation
  - PostgreSQL database with connection pooling
  - dbmate for raw SQL migrations
  - kysely for type-safe query building
  - kysely-codegen for TypeScript type generation
- **Internal:**
  - Plugins communicate via Fastify's decorator pattern
  - Cross-component logic should use Fastify's request/reply lifecycle
  - Database access via `fastify.kysely` decorator (available after kysely plugin registration)
  - Standardized responses via response helper functions from `src/lib/response-format.ts`
  - Centralized error handling via `error-handler` plugin (automatically processes validation and Fastify errors)

## Examples
- To add a new route: create a file in `src/routes/feature/route-name.ts`, export a Fastify plugin with a single route handler
  - Example: `src/routes/auth/signup.ts` exports a plugin with `POST /` handler (becomes `/auth/signup`)
  - Use `FastifyPluginAsyncTypebox` type for automatic TypeScript inference with TypeBox schemas
  - Include all schemas, validation, and logic within the route file
  - Use standardized response methods: `reply.code(statusCode).send(successResponse())`, `reply.code(statusCode).send(errorResponse())`, etc.
  - Wrap response schemas with response schema wrappers for consistent API documentation
- To add a new plugin: add to `src/plugins/` and it will be auto-registered
- To add a test: create a `*.test.ts` file in `test/` mirroring the source file's path
- To add a database migration: run `pnpm migrate:new <migration_name>`, edit the generated SQL file, then `pnpm migrate:up`
- To query the database: use `fastify.kysely` with full TypeScript support from auto-generated types

## References
- See `src/app.ts` for app bootstrap and plugin/route registration
- See `src/plugins/kysely.ts` for database connection and Kysely setup
- See `src/lib/response-format.ts` for standardized response patterns and schema wrapping
- See `src/plugins/error-handler.ts` for centralized error handling patterns
- See `src/types/database.ts` for auto-generated database types
- See `db/migrations/` for SQL migration examples
- See `src/routes/auth/signup.ts` for example route implementation with standardized responses
- See `test/plugins/auth.test.ts` for plugin test structure
- See `test/routes/auth/signup.ts` for route test structure
