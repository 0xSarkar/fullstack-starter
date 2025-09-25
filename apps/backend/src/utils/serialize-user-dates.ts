export function serializeUserDates<T extends { created_at: Date; updated_at: Date; }>(
  user: T
): Omit<T, 'created_at' | 'updated_at'> & { created_at: string; updated_at: string; } {
  return {
    ...user,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString()
  };
}
