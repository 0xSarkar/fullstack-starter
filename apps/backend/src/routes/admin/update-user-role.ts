import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  errorResponse,
  UserIdParamSchema,
  UpdateUserRoleSchema,
  UpdateUserRoleResponseSchema,
  DefaultErrorResponseSchema
} from '@fullstack-starter/shared-schemas';
import { serializeUserDates } from '../../utils/serialize-user-dates.js';

const UpdateUserRoleRequestSchema = {
  params: UserIdParamSchema,
  body: UpdateUserRoleSchema,
  response: {
    200: UpdateUserRoleResponseSchema,
    400: DefaultErrorResponseSchema,
    401: DefaultErrorResponseSchema,
    403: DefaultErrorResponseSchema,
    404: DefaultErrorResponseSchema,
    default: DefaultErrorResponseSchema
  }
};

const updateUserRole: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  fastify.patch('/users/:userId/role', {
    schema: UpdateUserRoleRequestSchema,
    onRequest: fastify.authenticateAdmin
  }, async function (request, reply) {
    try {
      const { userId } = request.params;
      const { role } = request.body;

      // Check if user exists
      const existingUser = await fastify.kysely
        .selectFrom('users')
        .select(['id', 'role'])
        .where('id', '=', userId)
        .executeTakeFirst();

      if (!existingUser) {
        return reply.code(404).send(errorResponse('User not found'));
      }

      // Only super_admin can assign super_admin role
      if (role === 'super_admin' && request.user.role !== 'super_admin') {
        return reply.code(403).send(errorResponse('Only super admin can assign super admin role'));
      }

      // Prevent super_admin from demoting themselves
      if (request.user.id === userId && existingUser.role === 'super_admin' && role !== 'super_admin') {
        return reply.code(400).send(errorResponse('Super admin cannot demote themselves'));
      }

      // Prevent non-super_admin from modifying super_admin users
      if (existingUser.role === 'super_admin' && request.user.role !== 'super_admin') {
        return reply.code(403).send(errorResponse('Only super admin can modify super admin users'));
      }

      // Update user role
      const updatedUser = await fastify.kysely
        .updateTable('users')
        .set({
          role,
          updated_at: new Date()
        })
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirst();

      if (!updatedUser) {
        return reply.code(500).send(errorResponse('Failed to update user role'));
      }

      // Convert dates to strings for API response
      const userResponse = serializeUserDates(updatedUser);

      return reply.code(200).send({
        success: true as const,
        data: userResponse
      });

    } catch (error: unknown) {
      fastify.log.error({ error }, 'Error updating user role');
      return reply.code(500).send(errorResponse('Failed to update user role'));
    }
  });
};

export default updateUserRole;
