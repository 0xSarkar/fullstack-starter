import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { errorResponse, LogoutResponseSchema, DefaultErrorResponseSchema } from '@fullstack-starter/shared-schemas';

const LogoutSchema = {
  response: {
    200: LogoutResponseSchema,
    default: DefaultErrorResponseSchema
  }
};

const logout: FastifyPluginAsyncTypebox = async (fastify, _opts): Promise<void> => {
  void _opts;
  fastify.post('/logout', {
    schema: LogoutSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    try {
      // Clear the authentication cookie
      reply.clearAuthCookie();

      return reply.code(200).send({
        success: true as const,
        data: null,
        message: 'Logout successful'
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(errorResponse('Logout failed', 'LOGOUT_FAILED'));
    }
  });
};

export default logout;
