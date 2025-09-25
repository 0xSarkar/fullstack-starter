import { AppLayout } from '@/layouts/app-layout/app-layout';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';
import { HttpError, listNotesApi } from '@fullstack-starter/shared-api';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

function RouteErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoToHome = async () => {
    setIsLoading(true);
    await router.invalidate({ sync: true });
    await router.navigate({ to: '/' });
    setIsLoading(false);
  };

  useEffect(() => {
    if (error instanceof HttpError && error.status === 401) {
      const state = useAuthStore.getState();
      if (state.status === 'authenticated') {
        state.setFrom401();
        const path = window.location.pathname + window.location.search;
        toast.error('Session expired. Please log in again.');
        router.navigate({ to: '/login', search: { redirect: path } }).catch(() => { });
      }
    }
  }, [error, router]);

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
}

export const Route = createFileRoute('/_appLayout')({
  beforeLoad: async () => {
    const auth = useAuthStore.getState();
    // If we haven't bootstrapped yet, do it now
    if (auth.status === 'idle' || auth.status === 'loading') {
      await useAuthStore.getState().bootstrap();
    }
    if (useAuthStore.getState().status !== 'authenticated') {
      throw redirect({ to: '/login' });
    }
  },

  loader: async () => {
    return listNotesApi();
  },
  shouldReload: () => false,

  component: AppLayout,

  errorComponent: RouteErrorComponent,
});