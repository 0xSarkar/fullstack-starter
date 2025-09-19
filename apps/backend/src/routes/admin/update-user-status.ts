import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  successResponse,
  errorResponse,
  wrapSuccessResponseSchema,
  wrapErrorResponseSchema,
  AdminUserSchema,
  UserIdParamSchema,
  UpdateUserStatusSchema
} from '@fullstack-starter/shared-schemas';

const UpdateUserStatusRequestSchema = {
  params: UserIdParamSchema,
  body: UpdateUserStatusSchema,
  response: {
    200: wrapSuccessResponseSchema(AdminUserSchema),
    400: wrapErrorResponseSchema(),
    401: wrapErrorResponseSchema(),
    403: wrapErrorResponseSchema(),
    404: wrapErrorResponseSchema(),
    default: wrapErrorResponseSchema()
  }
};

const updateUserStatus: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  fastify.patch('/users/:userId/status', {
    schema: UpdateUserStatusRequestSchema,
    onRequest: fastify.authenticateAdmin
  }, async function (request, reply) {
    try {
      const { userId } = request.params;
      const { active } = request.body;

      // Check if user exists
      const existingUser = await fastify.kysely
        .selectFrom('users')
        .select(['id', 'role'])
        .where('id', '=', userId)
        .executeTakeFirst();

      if (!existingUser) {
        return reply.code(404).send(errorResponse('User not found'));
      }

      // Prevent super_admin from being deactivated
      if (existingUser.role === 'super_admin' && !active) {
        return reply.code(400).send(errorResponse('Super admin users cannot be deactivated'));
      }

      // Prevent users from deactivating themselves
      if (request.user.id === userId && !active) {
        return reply.code(400).send(errorResponse('You cannot deactivate yourself'));
      }

      // Update user status
      const updatedUser = await fastify.kysely
        .updateTable('users')
        .set({
          active,
          updated_at: new Date()
        })
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirst();

      if (!updatedUser) {
        return reply.code(500).send(errorResponse('Failed to update user status'));
      }

      // Convert dates to strings for API response
      const userResponse = {
        ...updatedUser,
        created_at: updatedUser.created_at.toISOString(),
        updated_at: updatedUser.updated_at.toISOString()
      };

      return reply.code(200).send(successResponse(userResponse));

    } catch (error: any) {
      fastify.log.error('Error updating user status:', error);
      return reply.code(500).send(errorResponse('Failed to update user status'));
    }
  });
};

export default updateUserStatus;
