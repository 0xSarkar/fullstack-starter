import { billingApi } from '@/api/billing-api';
import { createFileRoute } from '@tanstack/react-router';
import { PlansPage } from '@/pages/plans-page';


export const Route = createFileRoute('/_appLayout/plans')({
  validateSearch: (search) => {
    return {
      checkout: search.checkout === 'success' || search.checkout === 'cancel' ? search.checkout : undefined,
      session_id: typeof search.session_id === 'string' ? search.session_id : undefined,
    };
  },
  loader: async () => {
    return billingApi.getPlans();
  },
  component: PlansPage,
});