import { AuthLayout } from '@/layouts/auth-layout';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';
import { preloadGoogleGsiClient } from '@/hooks/use-google-gsi-client';

export const Route = createFileRoute('/_authLayout')({
  beforeLoad: async () => {
    const auth = useAuthStore.getState();
    // If we haven't bootstrapped yet, do it now
    if (auth.status === 'idle' || auth.status === 'loading') {
      await useAuthStore.getState().bootstrap();
    }
    if (useAuthStore.getState().status === 'authenticated') {
      throw redirect({ to: '/' });
    }
  },

  loader: () => {
    if (typeof window !== 'undefined') {
      preloadGoogleGsiClient();
    }
  },

  component: AuthLayout
});