import { AuthLayout } from '@/layouts/auth-layout';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';
import { meQueryOptions } from '@/data/queries/auth-queries';

export const Route = createFileRoute('/_authLayout')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const auth = useAuthStore.getState();

    // Set loading status if idle
    if (auth.status === 'idle') {
      auth.setLoading();
    }

    try {
      // Try to fetch user data
      const meData = await queryClient.ensureQueryData(meQueryOptions);

      if (meData.data?.user) {
        auth.setUser(meData.data.user);
        throw redirect({ to: '/' });
      } else {
        auth.clearUser();
      }
    } catch (error) {
      // If it's not a redirect error, user is not authenticated
      if (error instanceof Error && error.message.includes('redirect')) {
        throw error;
      }
      auth.clearUser();
    }
  },

  component: AuthLayout
});