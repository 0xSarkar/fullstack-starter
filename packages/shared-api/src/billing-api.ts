import type {
  CreateCheckoutSessionResponseType,
  CreateCheckoutSessionQueryType,
  CreateBillingPortalResponseType,
  ConfirmCheckoutSessionQueryType,
  ConfirmCheckoutSessionResponseType,
  PlansResponseType,
} from '@fullstack-starter/shared-schemas';
import { defaultClient } from './client.js';

export async function createCheckoutSession(priceId: string): Promise<CreateCheckoutSessionResponseType> {
  return defaultClient.post<CreateCheckoutSessionResponseType>('/billing/checkout', { priceId });
}

export async function confirmCheckoutSession(sessionId: string): Promise<ConfirmCheckoutSessionResponseType> {
  return defaultClient.get<ConfirmCheckoutSessionResponseType>('/billing/checkout', { session_id: sessionId });
}

export async function createBillingPortal(): Promise<CreateBillingPortalResponseType> {
  return defaultClient.post<CreateBillingPortalResponseType>('/billing/billing-portal');
}

export async function getPlans(): Promise<PlansResponseType> {
  return defaultClient.get<PlansResponseType>('/billing/plans');
}