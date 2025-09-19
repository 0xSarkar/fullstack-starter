import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { successResponse, wrapSuccessResponseSchema, wrapErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { PlansResponseSchema } from '@fullstack-starter/shared-schemas';

const PlansSchema = {
  response: {
    200: wrapSuccessResponseSchema(PlansResponseSchema),
    default: wrapErrorResponseSchema()
  }
};

const plans: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get('/plans', {
    schema: PlansSchema
  }, async function (request, reply) {
    try {
      const activePlans = await fastify.kysely
        .selectFrom('stripe_prices')
        .select([
          'id',
          'stripe_product_id',
          'stripe_price_id',
          'price_code',
          'price_name',
          'product_code',
          'product_name',
          'amount',
          'currency',
          'interval',
          'active'
        ])
        .where('active', '=', true)
        .orderBy('created_at', 'asc')
        .execute();

      return reply.code(200).send(successResponse(activePlans));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch plans',
        code: 'INTERNAL_ERROR'
      });
    }
  });
};

export default plans;
