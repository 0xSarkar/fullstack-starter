import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '@/pages/users-page';
import { listUsersApi } from '@fullstack-starter/shared-api';

export const Route = createFileRoute('/_appLayout/users')({
  component: UsersPage,

  loader: async () => {
    return listUsersApi();
  },
  shouldReload: () => false,
});
