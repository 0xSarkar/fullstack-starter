import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { errorResponse, DefaultErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { CreateCheckoutSessionResponse, CreateCheckoutSessionBody } from '@fullstack-starter/shared-schemas';

const CreateSchema = {
  body: CreateCheckoutSessionBody,
  response: {
    200: CreateCheckoutSessionResponse,
    default: DefaultErrorResponseSchema
  }
};

const createCheckoutSession: FastifyPluginAsyncTypebox = async (fastify) => {
  const stripe = fastify.stripe;

  fastify.post('/checkout', {
    schema: CreateSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    // Get price id from request body
    const { priceId } = request.body;
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
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}/plans?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/plans?checkout=cancel`,
        customer: customerId,
        client_reference_id: request.user.id,
      });

      return reply.code(200).send({
        success: true as const,
        data: {
          url: session.url ?? undefined
        }
      });
    } catch (err) {
      fastify.log.error({ err }, 'create-checkout-session failed');
      return reply.code(500).send(errorResponse('Unable to create checkout session', 'CHECKOUT_SESSION_CREATE_FAILED'));
    }
  });
};

export default createCheckoutSession;