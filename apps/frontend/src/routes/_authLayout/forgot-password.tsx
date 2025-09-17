import { ForgotPasswordPage } from '@/pages/forgot-password-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authLayout/forgot-password')({
  component: ForgotPasswordPage,
});
