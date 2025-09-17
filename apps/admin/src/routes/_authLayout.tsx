import { AuthLayout } from '@/layouts/auth-layout';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/_authLayout')({
  beforeLoad: async ({ context }) => {
    if (context.auth.status === 'idle' || context.auth.status === 'loading') {
      await useAuthStore.getState().bootstrap();
    }
    if (useAuthStore.getState().status === 'authenticated') {
      throw redirect({ to: '/' });
    }
  },

  component: AuthLayout
});