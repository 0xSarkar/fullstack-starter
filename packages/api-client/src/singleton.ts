// Singleton wrapper for the auto-generated client
// This file is safe from auto-generation and provides a reusable singleton pattern
import { createClient, type UnauthorizedHandler, type CreateClientOptions } from './client';

/**
 * Singleton API client wrapper that provides:
 * - Single instance per configuration
 * - onUnauthorized handler support
 * - All HTTP methods from the underlying client
 */
export class ApiClientSingleton {
  private _client: ReturnType<typeof createClient>;
  private _onUnauthorizedHandler?: UnauthorizedHandler;

  constructor(options: CreateClientOptions = {}) {
    // Create the client with our internal unauthorized handler
    this._client = createClient({
      ...options,
      onUnauthorized: () => {
        if (this._onUnauthorizedHandler) {
          this._onUnauthorizedHandler();
        }
      },
    });
  }

  /**
   * Register a handler to be called when a 401 response is received
   * This is typically used by main.tsx to handle session expiration
   */
  onUnauthorized(handler: UnauthorizedHandler): void {
    this._onUnauthorizedHandler = handler;
  }

  // Expose all HTTP methods from the underlying client
  get GET() { return this._client.GET; }
  get POST() { return this._client.POST; }
  get PUT() { return this._client.PUT; }
  get DELETE() { return this._client.DELETE; }
  get PATCH() { return this._client.PATCH; }
  get HEAD() { return this._client.HEAD; }
  get OPTIONS() { return this._client.OPTIONS; }
  get TRACE() { return this._client.TRACE; }
}

/**
 * Factory function to create a singleton API client instance
 * Use this in your app's lib/api-client.ts file
 */
export function createApiClientSingleton(options: CreateClientOptions = {}): ApiClientSingleton {
  return new ApiClientSingleton(options);
}

// Re-export types for convenience
export type { UnauthorizedHandler, CreateClientOptions } from './client';