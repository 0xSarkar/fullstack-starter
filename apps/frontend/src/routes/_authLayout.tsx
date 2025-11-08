import { AuthLayout } from '@/layouts/auth-layout';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';
import { preloadGoogleGsiClient } from '@/hooks/use-google-gsi-client';
import { meQueryOptions } from '@/data/queries/auth-queries';

export const Route = createFileRoute('/_authLayout')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const authStore = useAuthStore.getState();

    // Set loading state
    if (authStore.status === 'idle') {
      authStore.setLoading();
    }

    // Check if user is already authenticated
    try {
      const meData = await queryClient.ensureQueryData(meQueryOptions);

      if (meData.data?.user) {
        authStore.setUser(meData.data.user);
        throw redirect({ to: '/' });
      } else {
        authStore.clearUser();
      }
    } catch {
      // If we get an error (like 401), user is not authenticated
      authStore.clearUser();
    }
  },

  loader: () => {
    if (typeof window !== 'undefined') {
      preloadGoogleGsiClient();
    }
  },

  component: AuthLayout
});