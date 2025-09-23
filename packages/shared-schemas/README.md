# Shared Schemas

This package now exposes its TypeScript source directly during development (no build step required).

## Development

Imports resolve to `index.ts` which re-exports from `src/*.ts` using ESM-compatible `.js` extensions. `tsx` / TypeScript tooling automatically maps these to the `.ts` sources.

Run type checking in watch mode:

```
pnpm --filter @fullstack-starter/shared-schemas run typecheck --watch
```

## Publishing / Production Builds

If you need to publish or produce emitted JS (e.g. for a production bundle), run:

```
pnpm --filter @fullstack-starter/shared-schemas build
```

This will generate the `dist` folder, though consumers inside the monorepo do not rely on it during dev.

# @fullstack-starter/shared-schemas

Shared TypeBox schemas for API requests and responses. This package serves as the single source of truth for all type definitions used across the backend, frontend, and admin applications.