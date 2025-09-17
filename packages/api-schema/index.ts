import { Type, Static } from '@sinclair/typebox';

// Placeholder for shared API contracts
export const API_VERSION = 'v1';

// Re-export auth schemas
export * from './src/auth-schema.js';

// Re-export billing schemas
export * from './src/billing-schema.js';

// Re-export notes schemas
export * from './src/notes-schema.js';

// Re-export stripe schemas
export * from './src/stripe-schema.js';

// Re-export users schemas
export * from './src/users-schema.js';

// Re-export response utilities
export * from './src/response-schema.js';