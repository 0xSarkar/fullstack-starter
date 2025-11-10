import { Type, type Static } from '@sinclair/typebox';

export const CreateCheckoutSessionResponse = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    url: Type.Optional(Type.String()),
  }),
  message: Type.Optional(Type.String())
});

export type CreateCheckoutSessionResponseType = Static<typeof CreateCheckoutSessionResponse>;

export const CreateCheckoutSessionBody = Type.Object({
  priceId: Type.String(),
});

export type CreateCheckoutSessionBodyType = Static<typeof CreateCheckoutSessionBody>;

export const CreateBillingPortalResponse = Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    url: Type.Optional(Type.String()),
  }),
  message: Type.Optional(Type.String())
});

export type CreateBillingPortalResponseType = Static<typeof CreateBillingPortalResponse>;

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

export const GetPlansResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Array(PlanSchema),
  message: Type.Optional(Type.String())
});

export type GetPlansResponseType = Static<typeof GetPlansResponseSchema>;