import { ResetPasswordPage } from '@/pages/reset-password-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authLayout/reset-password')({
  component: ResetPasswordPage,
});

