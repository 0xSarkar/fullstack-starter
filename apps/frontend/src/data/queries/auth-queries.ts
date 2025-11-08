import { queryOptions } from '@tanstack/react-query';
import { meApi } from '@fullstack-starter/shared-api';

export const meQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => meApi(),
  retry: false, // Don't retry on 401
  staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
});
