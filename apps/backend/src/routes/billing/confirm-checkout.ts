import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { errorResponse, DefaultErrorResponseSchema, ConfirmCheckoutSessionQuery, ConfirmCheckoutSessionResponse } from '@fullstack-starter/shared-schemas';

const ConfirmSchema = {
  querystring: ConfirmCheckoutSessionQuery,
  response: {
    200: ConfirmCheckoutSessionResponse,
    default: DefaultErrorResponseSchema
  }
}; const confirmCheckoutSession: FastifyPluginAsyncTypebox = async (fastify) => {
  const stripe = fastify.stripe;

  fastify.get('/checkout', {
    schema: ConfirmSchema,
    // allow unauthenticated in case the frontend lost session; server will rely on session_id/metadata
  }, async function (request, reply) {
    const sessionId = request.query.session_id;

    if (!sessionId) {
      return reply.code(400).send(errorResponse('Missing session_id', 'MISSING_SESSION_ID'));
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      });

      // Determine canonical status based on payment_status
      let status: 'complete' | 'pending' | 'failed' = 'pending';

      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        status = 'complete';
      } else if (session.payment_status === 'unpaid') {
        status = 'pending';
      } else {
        status = 'failed';
      }

      return reply.code(200).send({
        success: true as const,
        data: {
          status,
        }
      });
    } catch (err) {
      if (isStripeError(err) && (err.statusCode === 404 || err.code === 'resource_missing')) {
        fastify.log.info({ err, sessionId }, 'confirm-checkout-session: session not found');
        return reply.code(404).send(errorResponse('Checkout session not found', 'SESSION_NOT_FOUND'));
      }

      fastify.log.error({ err, sessionId }, 'confirm-checkout-session failed');
      return reply.code(500).send(errorResponse('Unable to confirm checkout session', 'CHECKOUT_CONFIRM_FAILED'));
    }
  });
};

export default confirmCheckoutSession;

type StripeErrorShape = {
  statusCode?: number;
  code?: string;
};

function isStripeError(error: unknown): error is StripeErrorShape {
  return typeof error === 'object' && error !== null && ('statusCode' in error || 'code' in error);
}
