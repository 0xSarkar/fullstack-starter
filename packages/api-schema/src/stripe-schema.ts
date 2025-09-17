import { Type, Static } from '@sinclair/typebox';

export const WebhookSuccessResponse = Type.Object({
  received: Type.Boolean(),
});

export type WebhookSuccessResponseType = Static<typeof WebhookSuccessResponse>;

// Subscription status enum matching database
export const SubscriptionStatusSchema = Type.Union([
  Type.Literal('incomplete'),
  Type.Literal('incomplete_expired'),
  Type.Literal('trialing'),
  Type.Literal('active'),
  Type.Literal('past_due'),
  Type.Literal('canceled'),
  Type.Literal('unpaid'),
  Type.Literal('paused'),
]);

// Subscription data schema
export const SubscriptionDataSchema = Type.Object({
  stripe_price_id: Type.String(),
  status: SubscriptionStatusSchema,
  stripe_product_id: Type.String(),
  current_period_start: Type.Optional(Type.String({ format: 'date-time' })),
  current_period_end: Type.Optional(Type.String({ format: 'date-time' })),
  cancel_at_period_end: Type.Boolean(),
  price_name: Type.Optional(Type.String()),
  product_name: Type.Optional(Type.String()),
  amount: Type.Optional(Type.Number()),
  currency: Type.Optional(Type.String()),
  interval: Type.Optional(Type.String()),
});

export type SubscriptionData = Static<typeof SubscriptionDataSchema>;
