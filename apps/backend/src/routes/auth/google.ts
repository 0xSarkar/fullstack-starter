import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { OAuth2Client } from 'google-auth-library';
import { successResponse, errorResponse, wrapSuccessResponseSchema, wrapErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { GoogleLoginRequestSchema, GoogleLoginResponseSchema } from '@fullstack-starter/shared-schemas';

// Schema definition for the route
const GoogleAuthSchema = {
  body: GoogleLoginRequestSchema,
  response: {
    200: wrapSuccessResponseSchema(GoogleLoginResponseSchema),
    default: wrapErrorResponseSchema()
  }
};

const googleAuthRoute: FastifyPluginAsyncTypebox = async (fastify) => {
  const clientId = fastify.config.GOOGLE_CLIENT_ID;
  if (!clientId) {
    fastify.log.warn('GOOGLE_CLIENT_ID not configured. /auth/google route will reject requests.');
  }

  const oauthClient = new OAuth2Client(clientId);

  fastify.post('/google', { schema: GoogleAuthSchema }, async (request: any, reply) => {
    if (!clientId) {
      return reply.code(500).send(errorResponse('Google auth not configured', 'GOOGLE_AUTH_DISABLED'));
    }

    const { credential } = request.body;

    try {
      // Verify the ID token
      const ticket = await oauthClient.verifyIdToken({ idToken: credential, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload) {
        return reply.code(401).send(errorResponse('Invalid Google credential', 'INVALID_GOOGLE_TOKEN'));
      }

      const { sub, email, email_verified, name } = payload;

      if (!email || !email_verified) {
        return reply.code(401).send(errorResponse('Unverified Google account email', 'EMAIL_NOT_VERIFIED'));
      }

      // Try to find existing provider link first
      const existingProvider = await fastify.kysely
        .selectFrom('user_providers')
        .innerJoin('users', 'users.id', 'user_providers.user_id')
        .select([
          'users.id as id',
          'users.email as email',
          'users.display_name as display_name'
        ])
        .where('user_providers.provider', '=', 'google')
        .where('user_providers.provider_user_id', '=', sub)
        .executeTakeFirst();

      let userId: string;
      let userEmail: string;
      let userDisplayName: string | null;

      if (existingProvider) {
        userId = existingProvider.id;
        userEmail = existingProvider.email;
        userDisplayName = existingProvider.display_name;
      } else {
        // Check if a user already exists with this email (email/password signup earlier)
        const existingUserByEmail = await fastify.kysely
          .selectFrom('users')
          .select(['id', 'email', 'display_name'])
          .where('email', '=', email)
          .executeTakeFirst();

        if (existingUserByEmail) {
          userId = existingUserByEmail.id;
          userEmail = existingUserByEmail.email;
          userDisplayName = existingUserByEmail.display_name;
          // Link provider (ignore duplicate race with unique constraint by catching error)
          try {
            await fastify.kysely
              .insertInto('user_providers')
              .values({
                user_id: userId,
                provider: 'google',
                provider_user_id: sub
              })
              .execute();
          } catch (err: any) {
            // Unique constraint violation is fine (simultaneous requests)
            if (!/duplicate key/i.test(err?.message)) {
              fastify.log.error({ err }, 'Failed linking existing user to google');
            }
          }
        } else {
          // Create new user with null password_hash
          const insertedUser = await fastify.kysely
            .insertInto('users')
            .values({
              email,
              password_hash: null,
              display_name: name || null
            })
            .returning(['id', 'email', 'display_name'])
            .executeTakeFirstOrThrow();

          userId = insertedUser.id;
          userEmail = insertedUser.email;
          userDisplayName = insertedUser.display_name;
          await fastify.kysely
            .insertInto('user_providers')
            .values({
              user_id: userId,
              provider: 'google',
              provider_user_id: sub
            })
            .execute();
        }
      }

      // Issue JWT
      const token = await reply.jwtSign(fastify.createJWTPayload({ id: userId, email: userEmail }));
      reply.setAuthCookie(token);

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
        .where('stripe_subscriptions.user_id', '=', userId)
        .executeTakeFirst();

      return reply.code(200).send(successResponse({
        user: {
          id: userId,
          email: userEmail,
          display_name: userDisplayName || undefined,
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
        },
        token
      }, 'Google login successful'));
    } catch (err: any) {
      fastify.log.error({ err }, 'Google auth failed');
      return reply.code(401).send(errorResponse('Google authentication failed', 'GOOGLE_AUTH_FAILED'));
    }
  });
};

export default googleAuthRoute;