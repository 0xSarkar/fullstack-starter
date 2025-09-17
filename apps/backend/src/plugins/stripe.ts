
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import Stripe from 'stripe';

const stripePlugin: FastifyPluginAsync = async (fastify) => {
  // Create Stripe instance using secret from config
  const stripe = new Stripe(fastify.config.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil'
  });

  // Decorate fastify with the stripe instance
  fastify.decorate('stripe', stripe);

  // No shutdown action required for Stripe, but keep hook for symmetry
  fastify.addHook('onClose', async () => {
    // Stripe SDK doesn't require explicit teardown. Placeholder for future needs.
  });
};

export default fp(stripePlugin, {
  name: 'stripe',
  dependencies: ['config']
});

// Type declarations for our decorator
declare module 'fastify' {
  interface FastifyInstance {
    stripe: Stripe;
  }
}
