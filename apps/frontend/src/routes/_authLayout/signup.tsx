import { SignupPage } from '@/pages/signup-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authLayout/signup')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; } => ({
    redirect: (search.redirect as string) || undefined,
  }),
  component: SignupPage,
});
