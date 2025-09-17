// Public entry for the generated API client
export { createClient as createApiClient } from './src/client';
export type { paths, UnauthorizedHandler } from './src/client';

// Convenience default client factory
export { default } from './src/client';

// Singleton wrapper exports
export {
  ApiClientSingleton,
  createApiClientSingleton,
  type CreateClientOptions
} from './src/singleton';
