import client from '@/lib/api-client';

async function createCheckoutSession(priceId: string) {
  const { data, error } = await client.POST('/billing/checkout', {
    params: { query: { priceId } },
  });
  if (error) throw error;
  return data.data;
}

async function confirmCheckoutSession(sessionId: string) {
  const { data, error } = await client.GET('/billing/checkout', {
    params: { query: { session_id: sessionId } },
  });
  if (error) throw error;
  return data.data;
}

async function createBillingPortal() {
  const { data, error } = await client.POST('/billing/billing-portal');
  if (error) throw error;
  return data.data;
}

async function getPlans() {
  const { data, error } = await client.GET('/billing/plans');
  if (error) throw error;
  return data.data;
}

export const billingApi = {
  createCheckoutSession,
  confirmCheckoutSession,
  createBillingPortal,
  getPlans,
};