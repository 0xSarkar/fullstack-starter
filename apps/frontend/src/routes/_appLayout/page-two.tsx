import { PageTwo } from '@/pages/page-two';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_appLayout/page-two')({
  component: PageTwo,
});
