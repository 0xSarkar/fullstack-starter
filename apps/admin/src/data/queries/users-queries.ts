import { queryOptions } from '@tanstack/react-query';
import type { ListUsersQuery, ListUsersResponse } from '@fullstack-starter/shared-schemas';
import { http } from '@/lib/http';

export const usersQueryOptions = (query: ListUsersQuery) =>
  queryOptions({
    queryKey: ['users', query],
    queryFn: () => http.get<ListUsersResponse>('/admin/users', query),
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
  });
