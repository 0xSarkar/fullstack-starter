import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { successResponse, errorResponse, wrapSuccessResponseSchema, wrapErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { MeResponseSchema } from '@fullstack-starter/shared-schemas';

const MeSchema = {
  response: {
    200: wrapSuccessResponseSchema(MeResponseSchema),
    default: wrapErrorResponseSchema()
  }
};

const me: FastifyPluginAsyncTypebox = async (fastify, opts): Promise<void> => {
  fastify.get('/me', {
    schema: MeSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    try {
      // The user is already authenticated via onRequest
      // request.user contains the JWT payload with id and email
      const user = request.user;

      // Optionally fetch additional user data from database
      const userData = await fastify.kysely
        .selectFrom('users')
        .select(['id', 'email', 'display_name'])
        .where('id', '=', user.id)
        .executeTakeFirst();

      if (!userData) {
        return reply.code(401).send(errorResponse('User not found', 'USER_NOT_FOUND'));
      }

      // Fetch subscription data if exists
      const subscriptionData = await fastify.kysely
        .selectFrom('stripe_subscriptions')
        .innerJoin('stripe_prices', 'stripe_prices.stripe_price_id', 'stripe_subscriptions.stripe_price_id')
        .select([
          'stripe_subscriptions.stripe_price_id',
          'stripe_subscriptions.status',
          'stripe_subscriptions.stripe_product_id',
          'stripe_subscriptions.current_period_start',
          'stripe_subscriptions.current_period_end',
          'stripe_subscriptions.cancel_at_period_end',
          'stripe_prices.price_name',
          'stripe_prices.product_name',
          'stripe_prices.amount',
          'stripe_prices.currency',
          'stripe_prices.interval'
        ])
        .where('stripe_subscriptions.user_id', '=', user.id)
        .executeTakeFirst();

      const response = {
        user: {
          id: userData.id,
          email: userData.email,
          display_name: userData.display_name || undefined,
          subscription: subscriptionData ? {
            stripe_price_id: subscriptionData.stripe_price_id,
            status: subscriptionData.status,
            stripe_product_id: subscriptionData.stripe_product_id,
            current_period_start: subscriptionData.current_period_start?.toISOString(),
            current_period_end: subscriptionData.current_period_end?.toISOString(),
            cancel_at_period_end: subscriptionData.cancel_at_period_end,
            price_name: subscriptionData.price_name || undefined,
            product_name: subscriptionData.product_name || undefined,
            amount: subscriptionData.amount || undefined,
            currency: subscriptionData.currency || undefined,
            interval: subscriptionData.interval || undefined,
          } : undefined
        }
      };

      return reply.code(200).send(successResponse(response, 'User data retrieved successfully'));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(errorResponse('Failed to retrieve user data', 'USER_DATA_FETCH_FAILED'));
    }
  });
};

export default me;
