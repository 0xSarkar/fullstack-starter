import { Type, type Static } from "@sinclair/typebox";

export type ErrorDetails =
  | Record<string, unknown>
  | Array<unknown>
  | string
  | number
  | boolean
  | null;

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: ErrorDetails;
}

// Default error response schema for consistent error handling
export const DefaultErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.String({
    description: 'Human-readable error message',
    examples: ['User already exists', 'Validation failed', 'Internal server error']
  }),
  code: Type.Optional(Type.String({
    description: 'Machine-readable error code for programmatic handling',
    examples: ['USER_EXISTS', 'VALIDATION_ERROR', 'UNAUTHORIZED', 'INTERNAL_ERROR']
  })),
  details: Type.Optional(Type.Unknown({
    description: 'Additional error context (structure varies by error type)'
  }))
}, {
  description: 'Default error response format',
});

// TypeScript type for the default error response
export type DefaultErrorResponse = Static<typeof DefaultErrorResponseSchema>;

export function errorResponse(
  error: string,
  code?: string,
  details?: ErrorDetails
): ErrorResponse {
  return {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details })
  };
}