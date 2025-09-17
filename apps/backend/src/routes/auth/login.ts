import bcrypt from 'bcrypt';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { successResponse, wrapSuccessResponseSchema, errorResponse, wrapErrorResponseSchema } from '@fullstack-starter/api-schema';
import { LoginRequestSchema, LoginResponseSchema } from '@fullstack-starter/api-schema';

const LoginSchema = {
  body: LoginRequestSchema,
  response: {
    200: wrapSuccessResponseSchema(LoginResponseSchema),
    default: wrapErrorResponseSchema()
  }
};

const login: FastifyPluginAsyncTypebox = async (fastify, opts): Promise<void> => {
  fastify.post('/login', {
    schema: LoginSchema
  }, async function (request, reply) {
    const { email, password } = request.body;

    try {
      // Find user by email
      const user = await fastify.kysely
        .selectFrom('users')
        .select(['id', 'email', 'password_hash', 'display_name'])
        .where('email', '=', email)
        .executeTakeFirst();

      if (!user) {
        return reply.code(401).send(errorResponse('Invalid credentials', 'INVALID_CREDENTIALS'));
      }

      // Check if user has a password (not a social-only account)
      if (!user.password_hash) {
        return reply.code(401).send(errorResponse('This account was created with Google. Please log in with Google.', 'SOCIAL_ONLY_ACCOUNT'));
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return reply.code(401).send(errorResponse('Invalid credentials', 'INVALID_CREDENTIALS'));
      }

      // Generate JWT token
      const jwtPayload = fastify.createJWTPayload({
        id: user.id,
        email: user.email
      });
      const token = await reply.jwtSign(jwtPayload);

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

      // Set secure auth cookie
      reply.setAuthCookie(token);

      // Return user data with token
      const authResponse = {
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name || undefined,
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
      };
      //return reply.success<LoginResponseType>(authResponse, 'Login successful');
      return reply.code(200).send(successResponse(authResponse));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(errorResponse('Login failed', 'LOGIN_FAILED'));
    }
  });
};

export default login;
