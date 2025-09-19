import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { successResponse, errorResponse, wrapSuccessResponseSchema, wrapErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { CreateBillingPortalResponse } from '@fullstack-starter/shared-schemas';

const CreateSchema = {
  response: {
    200: wrapSuccessResponseSchema(CreateBillingPortalResponse),
    default: wrapErrorResponseSchema()
  }
};

const createBillingPortal: FastifyPluginAsyncTypebox = async (fastify) => {
  const stripe = fastify.stripe;

  fastify.post('/billing-portal', {
    schema: CreateSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    const frontendUrl = fastify.config.FRONTEND_URL || 'http://localhost:3000';

    // Get user data including stripe_customer_id
    const userData = await fastify.kysely
      .selectFrom('users')
      .select(['id', 'email', 'display_name', 'stripe_customer_id'])
      .where('id', '=', request.user.id)
      .executeTakeFirst();

    if (!userData) {
      return reply.code(404).send(errorResponse('User not found', 'USER_NOT_FOUND'));
    }

    let customerId = userData.stripe_customer_id;

    // Create Stripe customer if it doesn't exist
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: userData.email,
          name: userData.display_name || undefined,
        });
        customerId = customer.id;

        // Update user record with the new customer ID
        await fastify.kysely
          .updateTable('users')
          .set({
            stripe_customer_id: customerId,
            updated_at: new Date()
          })
          .where('id', '=', request.user.id)
          .execute();
      } catch (err) {
        fastify.log.error({ err }, 'Failed to create Stripe customer');
        return reply.code(500).send(errorResponse('Unable to create customer', 'CUSTOMER_CREATE_FAILED'));
      }
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${frontendUrl}/plans`,
      });

      return reply.code(200).send(successResponse({ url: session.url }));
    } catch (err) {
      fastify.log.error({ err }, 'create-billing-portal failed');
      return reply.code(500).send(errorResponse('Unable to create billing portal session', 'BILLING_PORTAL_CREATE_FAILED'));
    }
  });
};

export default createBillingPortal;