import bcrypt from 'bcrypt';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { successResponse, errorResponse, wrapSuccessResponseSchema, wrapErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { SignupRequestSchema, SignupResponseSchema } from '@fullstack-starter/shared-schemas';

const SignupSchema = {
  body: SignupRequestSchema,
  response: {
    201: wrapSuccessResponseSchema(SignupResponseSchema),
    default: wrapErrorResponseSchema()
  }
};

const signup: FastifyPluginAsyncTypebox = async (fastify, opts): Promise<void> => {
  fastify.post('/signup', {
    schema: SignupSchema
  }, async function (request, reply) {
    const { email, password } = request.body;

    try {
      // Check if user already exists
      const existingUser = await fastify.kysely
        .selectFrom('users')
        .select(['id'])
        .where('email', '=', email)
        .executeTakeFirst();

      if (existingUser) {
        return reply.code(409).send(errorResponse('User already exists', 'USER_EXISTS'));
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      const newUser = await fastify.kysely
        .insertInto('users')
        .values({
          email,
          password_hash
        })
        .returning(['id', 'email', 'display_name'])
        .executeTakeFirstOrThrow();

      // Generate JWT token for new user
      const jwtPayload = fastify.createJWTPayload({
        id: newUser.id,
        email: newUser.email
      });
      const token = await reply.jwtSign(jwtPayload);

      // Set secure auth cookie
      reply.setAuthCookie(token);

      // Return user data with token
      const authResponse = {
        user: {
          id: newUser.id,
          email: newUser.email,
          display_name: newUser.display_name || undefined,
          subscription: undefined // New users don't have subscriptions yet
        },
        token
      };
      return reply.code(201).send(successResponse(authResponse, 'User created successfully'));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(errorResponse('Failed to create user', 'USER_CREATION_FAILED'));
    }
  });
};

export default signup;

