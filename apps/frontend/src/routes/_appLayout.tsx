import { AppLayout } from '@/layouts/app-layout/app-layout';
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { HttpError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { notesQueryOptions } from '@/data/queries/notes-queries';
import { meQueryOptions } from '@/data/queries/auth-queries';

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
      const path = window.location.pathname + window.location.search;
      toast.error('Session expired. Please log in again.');
      router.navigate({ to: '/login', search: { redirect: path } }).catch(() => { });
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
  beforeLoad: async ({ context: { queryClient } }) => {
    // Fetch and ensure user is authenticated
    try {
      const meData = await queryClient.ensureQueryData(meQueryOptions);

      if (!meData.data?.user) {
        throw redirect({ to: '/login' });
      }
    } catch (error) {
      console.error('Error fetching authenticated user:', error);
      throw redirect({ to: '/login' });
    }
  },

  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(notesQueryOptions);
  },

  component: AppLayout,

  errorComponent: RouteErrorComponent,
});