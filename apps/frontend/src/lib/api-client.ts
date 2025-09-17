import { createApiClientSingleton } from '@fullstack-starter/api-client';

// Create and export singleton instance
export const client = createApiClientSingleton({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
});

export default client;
