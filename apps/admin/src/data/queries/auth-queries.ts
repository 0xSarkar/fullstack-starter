import { queryOptions, useQuery } from '@tanstack/react-query';
import { meApi } from '@fullstack-starter/shared-api';

export const meQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => meApi(),
  retry: false, // Don't retry on 401
  staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
});

/**
 * Convenience hook for accessing current authenticated user
 */
export function useAuth() {
  const query = useQuery(meQueryOptions);

  return {
    user: query.data?.data?.user ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data?.data?.user,
    error: query.error,
  };
}
