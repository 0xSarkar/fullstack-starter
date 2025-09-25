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

type NormalizedTimestampFields<T, K extends keyof T> = Omit<T, K> & { [P in K]: string };

export function normalizeTimestampFields<T extends Record<string, unknown>, K extends keyof T>(
  entity: T,
  keys: readonly K[]
): NormalizedTimestampFields<T, K> {
  const result: Record<string, unknown> = { ...entity };

  for (const key of keys) {
    const value = entity[key];
    result[key as string] = normalizeTimestamp(value as Date | string);
  }

  return result as NormalizedTimestampFields<T, K>;
}
