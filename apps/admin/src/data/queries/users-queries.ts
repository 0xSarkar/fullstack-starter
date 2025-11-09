import { queryOptions } from '@tanstack/react-query';
import { listUsersApi } from '@fullstack-starter/shared-api';
import type { ListUsersQuery } from '@fullstack-starter/shared-schemas';

export const usersQueryOptions = (query: ListUsersQuery) =>
  queryOptions({
    queryKey: ['users', query],
    queryFn: () => listUsersApi(query),
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
  });
