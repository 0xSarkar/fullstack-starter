export function normalizeTimestamp(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  throw new TypeError('Expected a Date or ISO string timestamp');
}

export function normalizeOptionalTimestamp(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return normalizeTimestamp(value);
}
