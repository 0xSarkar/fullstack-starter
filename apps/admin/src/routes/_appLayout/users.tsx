import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '@/pages/users-page';
import { listUsersApi } from '@fullstack-starter/shared-api';
import type { ListUsersQuery } from '@fullstack-starter/shared-schemas';

type UsersSearch = {
  offset: number;
  limit: number;
  q?: string;
  role?: string;
};

export const Route = createFileRoute('/_appLayout/users')({
  component: UsersPage,

  validateSearch: (search: Record<string, unknown>): UsersSearch => ({
    offset: (typeof search.offset === 'number' ? search.offset : 0),
    limit: (typeof search.limit === 'number' ? search.limit : 20),
    q: (typeof search.q === 'string' ? search.q : undefined),
    role: (typeof search.role === 'string' ? search.role : undefined),
  }),

  loaderDeps: ({ search }) => search,

  loader: async ({ deps: { offset, limit, q, role } }) => {
    const page = Math.floor(offset / limit) + 1;
    const query: ListUsersQuery = {
      page,
      limit,
      search: q,
      role: role as 'user' | 'admin' | 'super_admin' | undefined,
    };
    return listUsersApi(query);
  },
  shouldReload: () => false,
});
