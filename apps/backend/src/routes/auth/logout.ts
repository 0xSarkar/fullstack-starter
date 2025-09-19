import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { emptySuccessResponse, errorResponse, wrapEmptySuccessResponseSchema, wrapErrorResponseSchema } from '@fullstack-starter/shared-schemas';

const LogoutSchema = {
  response: {
    200: wrapEmptySuccessResponseSchema(),
    default: wrapErrorResponseSchema()
  }
};

const logout: FastifyPluginAsyncTypebox = async (fastify, opts): Promise<void> => {
  fastify.post('/logout', {
    schema: LogoutSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    try {
      // Clear the authentication cookie
      reply.clearAuthCookie();

      return reply.code(200).send(emptySuccessResponse('Logout successful'));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(errorResponse('Logout failed', 'LOGOUT_FAILED'));
    }
  });
};

export default logout;
