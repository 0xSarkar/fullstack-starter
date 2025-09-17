import { Type, Static } from '@sinclair/typebox';

export const CreateCheckoutSessionResponse = Type.Object({
  url: Type.Optional(Type.String()),
});

export type CreateCheckoutSessionResponseType = Static<typeof CreateCheckoutSessionResponse>;

export const CreateCheckoutSessionQuery = Type.Object({
  priceId: Type.String(),
});

export type CreateCheckoutSessionQueryType = Static<typeof CreateCheckoutSessionQuery>;

export const CreateBillingPortalResponse = Type.Object({
  url: Type.Optional(Type.String()),
});

export type CreateBillingPortalResponseType = Static<typeof CreateBillingPortalResponse>;

export const ConfirmCheckoutSessionQuery = Type.Object({
  session_id: Type.String(),
});

export const ConfirmCheckoutSessionResponse = Type.Object({
  status: Type.Union([
    Type.Literal('complete'),
    Type.Literal('pending'),
    Type.Literal('failed'),
  ]),
});

export type ConfirmCheckoutSessionQueryType = Static<typeof ConfirmCheckoutSessionQuery>;
export type ConfirmCheckoutSessionResponseType = Static<typeof ConfirmCheckoutSessionResponse>;

export const PlanSchema = Type.Object({
  id: Type.String(),
  stripe_product_id: Type.String(),
  stripe_price_id: Type.String(),
  price_code: Type.Union([Type.String(), Type.Null()]),
  price_name: Type.Union([Type.String(), Type.Null()]),
  product_code: Type.Union([Type.String(), Type.Null()]),
  product_name: Type.Union([Type.String(), Type.Null()]),
  amount: Type.Union([Type.Number(), Type.Null()]),
  currency: Type.Union([Type.String(), Type.Null()]),
  interval: Type.Union([Type.String(), Type.Null()]),
  active: Type.Boolean(),
});

export type PlanType = Static<typeof PlanSchema>;

export const PlansResponseSchema = Type.Array(PlanSchema);

export type PlansResponseType = Static<typeof PlansResponseSchema>;
