import { type TSchema, Type } from "@sinclair/typebox";

// Response type interfaces
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> extends SuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Schema wrappers for OpenAPI documentation
export function wrapSuccessResponseSchema<T extends TSchema>(dataSchema: T) {
  return Type.Object({
    success: Type.Literal(true),
    data: dataSchema,
    message: Type.Optional(Type.String())
  });
}

export function wrapEmptySuccessResponseSchema() {
  return Type.Object({
    success: Type.Literal(true),
    data: Type.Null(),
    message: Type.Optional(Type.String())
  });
}

export function wrapErrorResponseSchema(detailsSchema?: TSchema) {
  const defaultDetailsSchema = ValidationErrorDetails;
  const effectiveDetailsSchema = detailsSchema || defaultDetailsSchema;

  return Type.Object({
    success: Type.Literal(false),
    error: Type.String({
      description: 'Human-readable error message',
      examples: ['User already exists', 'Validation failed', 'Internal server error']
    }),
    code: Type.Optional(Type.String({
      description: 'Machine-readable error code for programmatic handling',
      examples: ['USER_EXISTS', 'VALIDATION_ERROR', 'UNAUTHORIZED', 'INTERNAL_ERROR']
    })),
    details: Type.Optional(effectiveDetailsSchema)
  }, {
    description: 'Error response format',
  });
}

// Reusable pagination schema
export const PaginationSchema = Type.Object({
  page: Type.Number(),
  limit: Type.Number(),
  total: Type.Number(),
  totalPages: Type.Number()
});

// Validation error details schema
export const ValidationErrorDetails = Type.Object({
  errors: Type.Optional(Type.Array(Type.Object({
    field: Type.String({
      description: 'Field name that failed validation',
      examples: ['email', 'password']
    }),
    message: Type.String({
      description: 'Human-readable error message',
      examples: ['Invalid format', 'Too short', 'Required field']
    })
  }), {
    description: 'Array of validation errors if present'
  }))
}, {
  description: 'Additional error context (structure varies by error type)'
});

export function wrapPaginatedResponseSchema<T extends TSchema>(dataSchema: T) {
  return Type.Object({
    success: Type.Literal(true),
    data: Type.Array(dataSchema),
    pagination: PaginationSchema,
    message: Type.Optional(Type.String())
  });
}

// Response helper functions
export function successResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message })
  };
}

export function emptySuccessResponse(message?: string): SuccessResponse<null> {
  return {
    success: true,
    data: null,
    ...(message && { message })
  };
}

export function errorResponse(
  error: string,
  code?: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details })
  };
}

export function paginatedResponse<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number; },
  message?: string
): PaginatedResponse<T> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages
    },
    ...(message && { message })
  };
}