import { HttpError } from './client';

export type ApiFieldError = { field: string; message: string; };

export function getFieldErrors(error: unknown): ApiFieldError[] {
  if (!(error instanceof HttpError)) {
    return [];
  }

  const details = error.details as { errors?: unknown; } | undefined;
  if (!details || !Array.isArray(details.errors)) {
    return [];
  }

  return details.errors.filter((item): item is ApiFieldError => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const { field, message } = item as Record<string, unknown>;
    return typeof field === 'string' && typeof message === 'string';
  });
}
