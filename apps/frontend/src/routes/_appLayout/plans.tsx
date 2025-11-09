import type { GetPlansResponseType } from '@fullstack-starter/shared-schemas';
import { createFileRoute } from '@tanstack/react-router';
import { PlansPage } from '@/pages/plans-page';
import { http } from '@/lib/http';


export const Route = createFileRoute('/_appLayout/plans')({
  validateSearch: (search) => {
    return {
      checkout: search.checkout === 'success' || search.checkout === 'cancel' ? search.checkout : undefined,
      session_id: typeof search.session_id === 'string' ? search.session_id : undefined,
    };
  },
  loader: async () => {
    return http.get<GetPlansResponseType>('/billing/plans');
  },
  component: PlansPage,
});