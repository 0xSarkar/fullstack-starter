import { AppLayout } from '@/layouts/app-layout/app-layout';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '@/api/users-api';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';

export const Route = createFileRoute('/_appLayout')({
  beforeLoad: async ({ context }) => {
    const auth = context.auth;
    // If we haven't bootstrapped yet, do it now
    if (auth.status === 'idle' || auth.status === 'loading') {
      await useAuthStore.getState().bootstrap();
    }
    if (useAuthStore.getState().status !== 'authenticated') {
      throw redirect({ to: '/login' });
    }
  },

  loader: async () => {
    return usersApi.listUsers();
  },
  shouldReload: () => false,

  component: AppLayout,

  errorComponent: ({ error }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleGoToHome = async () => {
      setIsLoading(true);
      await router.invalidate({ sync: true });
      await router.navigate({ to: '/' });
      setIsLoading(false);
    };

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-destructive mb-2">Oops! Something went wrong</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <Button
            onClick={handleGoToHome}
            className="mt-4"
            size={"lg"}
          >
            {isLoading && <LoaderCircle className='animate-spin' />}
            Go to Home
          </Button>
        </div>
      </div>
    );
  },
});