import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type Stripe from 'stripe';
import { Readable } from 'stream';
import { successResponse, errorResponse, wrapSuccessResponseSchema, wrapErrorResponseSchema, WebhookSuccessResponse } from '@fullstack-starter/shared-schemas';

const WebhookSchema = {
  response: {
    200: wrapSuccessResponseSchema(WebhookSuccessResponse),
    400: wrapErrorResponseSchema()
  }
};

const webhook: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  // Helper function to convert stream to buffer
  async function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  fastify.post("/webhook", {
    schema: WebhookSchema,
    preParsing: async (request, reply, payload) => {
      // Collect the raw body for Stripe signature verification
      const rawBody = await streamToBuffer(payload);
      (request as any).rawBody = rawBody;

      // Return a new stream with the same data for normal parsing
      const newStream = new Readable();
      newStream.push(rawBody);
      newStream.push(null);
      return newStream;
    }
  }, async function (request, reply) {
    const stripe = fastify.stripe;
    const webhookSecret = fastify.config.STRIPE_WEBHOOK_SECRET;

    const signature = request.headers["stripe-signature"];
    if (!signature || (Array.isArray(signature) && signature.length === 0)) {
      fastify.log.error('Missing Stripe signature header');
      return reply.code(400).send(errorResponse('Missing Stripe signature header'));
    }

    const signatureString = Array.isArray(signature) ? signature[0]! : signature;

    let webhookEvent;
    try {
      // Use the raw body stored in preParsing hook
      webhookEvent = stripe.webhooks.constructEvent(
        (request as any).rawBody,
        signatureString,
        webhookSecret
      );
    } catch (error: any) {
      fastify.log.error({ error: error.message }, 'Webhook signature verification failed');
      return reply.code(400).send(errorResponse('Webhook signature verification failed'));
    }

    // Process webhook event with transaction-based idempotency
    await fastify.kysely.transaction().execute(async (trx) => {
      // Check if event already exists and is processed
      const existingEvent = await trx
        .selectFrom('stripe_webhook_events')
        .select(['id', 'processed_at'])
        .where('stripe_event_id', '=', webhookEvent.id)
        .executeTakeFirst();

      if (existingEvent && existingEvent.processed_at) {
        fastify.log.info({ eventId: webhookEvent.id }, 'Event already processed, skipping');
        return;
      }

      // Insert the event if not exists (atomic with processing)
      await trx
        .insertInto('stripe_webhook_events')
        .values({
          stripe_event_id: webhookEvent.id,
          event_type: webhookEvent.type,
          payload: JSON.stringify(webhookEvent.data),
        })
        .onConflict((oc) => oc.column('stripe_event_id').doNothing())
        .execute();

      // Helper function to extract subscription data
      function getSubscriptionData(subscription: Stripe.Subscription) {
        const firstItem = subscription.items?.data?.[0];
        const product = firstItem?.price?.product;
        const stripe_product_id = typeof product === 'string' ? product : product?.id || '';
        const stripe_price_id = firstItem?.price?.id || '';
        const current_period_start = firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000) : null;
        const current_period_end = firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000) : null;
        return {
          stripe_subscription_id: subscription.id,
          stripe_product_id,
          stripe_price_id,
          status: subscription.status,
          current_period_start,
          current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
        };
      }

      // Unified upsert handler for subscription events (created/updated/deleted)
      async function upsertSubscription(subscription: Stripe.Subscription, opts?: { isDeleted?: boolean; }) {
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
        const user = await trx
          .selectFrom('users')
          .select('id')
          .where('stripe_customer_id', '=', customerId)
          .executeTakeFirst();
        if (!user) {
          fastify.log.error({ customerId, subscriptionId: subscription.id }, 'User not found for Stripe customer');
          return;
        }

        const data = getSubscriptionData(subscription);
        // If this is a deletion event, prefer to record the canceled status instead of deleting the row
        if (opts?.isDeleted) {
          data.status = subscription.status || 'canceled';
        }

        await trx
          .insertInto('stripe_subscriptions')
          .values({
            user_id: user.id,
            ...data,
          })
          .onConflict((oc) => oc.column('stripe_subscription_id').doUpdateSet({
            user_id: user.id,
            ...data,
          }))
          .execute();

        fastify.log.info({ subscriptionId: subscription.id }, 'Subscription upserted in database');
      }

      // Unified handler for invoice payment events (paid or payment_failed)
      async function handleInvoicePayment(invoice: Stripe.Invoice, isFailed = false) {
        // For subscription-related invoices the subscription field may be present.
        const invoiceData = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null; };

        let subscriptionId: string | undefined;
        if (invoiceData.subscription) {
          subscriptionId = typeof invoiceData.subscription === 'string' ? invoiceData.subscription : invoiceData.subscription?.id;
        }

        if (!subscriptionId) {
          fastify.log.info({ invoiceId: invoice.id }, `Invoice ${isFailed ? 'payment_failed' : 'paid'} but no subscription found`);
          return;
        }

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertSubscription(subscription);

          if (isFailed) {
            // Ensure subscription status reflects payment failure: map to `past_due`
            await trx
              .updateTable('stripe_subscriptions')
              .set({ status: 'past_due' })
              .where('stripe_subscription_id', '=', subscription.id)
              .execute();

            fastify.log.info({ invoiceId: invoice.id, subscriptionId }, 'Invoice payment failed: subscription marked past_due');
          } else {
            fastify.log.info({ invoiceId: invoice.id, subscriptionId }, 'Invoice paid, subscription synced');
          }
        } catch (error) {
          fastify.log.error({ error, invoiceId: invoice.id, subscriptionId }, `Failed to sync or mark subscription on invoice ${isFailed ? 'payment_failed' : 'paid'}`);
        }
      }

      // Handle and log the webhook event types we care about
      switch (webhookEvent.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          fastify.log.info({ id: webhookEvent.id, type: webhookEvent.type, data: webhookEvent.data }, `stripe webhook received: ${webhookEvent.type}`);
          try {
            const subscription = webhookEvent.data.object as Stripe.Subscription;
            const isDeleted = webhookEvent.type === 'customer.subscription.deleted';
            await upsertSubscription(subscription, { isDeleted });
          } catch (error) {
            fastify.log.error({ error }, `Failed to handle ${webhookEvent.type}`);
          }
          break;
        }

        case 'invoice.paid':
        case 'invoice.payment_failed': {
          fastify.log.info({ id: webhookEvent.id, type: webhookEvent.type, data: webhookEvent.data }, `stripe webhook received: ${webhookEvent.type}`);
          try {
            const invoice = webhookEvent.data.object as Stripe.Invoice;
            const isFailed = webhookEvent.type === 'invoice.payment_failed';
            await handleInvoicePayment(invoice, isFailed);
          } catch (error) {
            fastify.log.error({ error }, `Failed to handle ${webhookEvent.type}`);
          }
          break;
        }

        default:
        // fastify.log.info({ id: webhookEvent.id, type: webhookEvent.type }, 'stripe webhook received: unhandled event');
      }

      // Mark the webhook event as processed (within the same transaction)
      await trx
        .updateTable('stripe_webhook_events')
        .set({ processed_at: new Date() })
        .where('stripe_event_id', '=', webhookEvent.id)
        .execute();
    });

    return reply.code(200).send(successResponse({ received: true }));
  });
};

export default webhook;