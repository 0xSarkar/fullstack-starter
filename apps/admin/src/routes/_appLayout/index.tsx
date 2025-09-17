import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_appLayout/')({
  beforeLoad: () => {
    throw redirect({ to: '/users' });
  },
});
