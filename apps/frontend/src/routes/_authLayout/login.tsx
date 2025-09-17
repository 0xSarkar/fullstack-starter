import { LoginPage } from '@/pages/login-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authLayout/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; } => ({
    redirect: (search.redirect as string) || undefined,
  }),
  component: LoginPage,
});

