# Shared API Client

This package now consumes `@fullstack-starter/shared-schemas` directly from source and also exposes its own TypeScript source during development. No build step is required before running backend or frontend dev servers.

## Development

Use normal imports:

```ts
import { LoginRequestSchema } from '@fullstack-starter/shared-schemas';
```

TypeScript path mapping plus package `exports` point to `index.ts` which re-exports from `src/`.

Watch type checking:

```
pnpm --filter @fullstack-starter/shared-api run typecheck --watch
```

## Building (Optional)

Only needed if you want declaration emit or to test published layout:

```
pnpm --filter @fullstack-starter/shared-api build
```

# @fullstack-starter/shared-api

Shared typed API client functions for making HTTP requests to the backend. This package provides functions that handle authentication, error handling, and type-safe requests/responses using schemas from shared-schemas.