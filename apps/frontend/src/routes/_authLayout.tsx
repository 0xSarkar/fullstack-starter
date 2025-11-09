import { AuthLayout } from '@/layouts/auth-layout';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { preloadGoogleGsiClient } from '@/hooks/use-google-gsi-client';
import { meQueryOptions } from '@/data/queries/auth-queries';

export const Route = createFileRoute('/_authLayout')({
  beforeLoad: async ({ context: { queryClient } }) => {
    let shouldRedirectToHome = false;
    // Check if user is already authenticated
    try {
      const meData = await queryClient.ensureQueryData(meQueryOptions);

      if (meData.data?.user) {
        shouldRedirectToHome = true;
      }
    } catch {
      // If we get an error (like 401), user is not authenticated - continue
    }

    if (shouldRedirectToHome) {
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