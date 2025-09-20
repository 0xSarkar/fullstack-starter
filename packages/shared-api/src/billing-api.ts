import type {
  CreateCheckoutSessionResponseType,
  CreateBillingPortalResponseType,
  ConfirmCheckoutSessionResponseType,
  GetPlansResponseType,
} from '@fullstack-starter/shared-schemas';
import { defaultClient } from './client.js';

export async function createCheckoutSessionApi(priceId: string): Promise<CreateCheckoutSessionResponseType> {
  return defaultClient.post<CreateCheckoutSessionResponseType>('/billing/checkout', { priceId });
}

export async function confirmCheckoutSessionApi(sessionId: string): Promise<ConfirmCheckoutSessionResponseType> {
  return defaultClient.get<ConfirmCheckoutSessionResponseType>('/billing/checkout', { session_id: sessionId });
}

export async function createBillingPortalApi(): Promise<CreateBillingPortalResponseType> {
  return defaultClient.post<CreateBillingPortalResponseType>('/billing/billing-portal', {});
}

export async function getPlansApi(): Promise<GetPlansResponseType> {
  return defaultClient.get<GetPlansResponseType>('/billing/plans');
}