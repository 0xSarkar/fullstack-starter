import bcrypt from 'bcrypt';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { errorResponse, wrapErrorResponseSchema, emptySuccessResponse, wrapEmptySuccessResponseSchema } from '@fullstack-starter/shared-schemas';
import { UpdatePasswordRequestSchema } from '@fullstack-starter/shared-schemas';

const UpdatePasswordSchema = {
  body: UpdatePasswordRequestSchema,
  response: {
    200: wrapEmptySuccessResponseSchema(),
    default: wrapErrorResponseSchema()
  }
};

const updatePassword: FastifyPluginAsyncTypebox = async (fastify, opts): Promise<void> => {
  fastify.put('/update-password', {
    schema: UpdatePasswordSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    const { currentPassword, newPassword } = request.body;
    const user = request.user;

    try {
      // Fetch current user data including password hash
      const userData = await fastify.kysely
        .selectFrom('users')
        .select(['id', 'password_hash'])
        .where('id', '=', user.id)
        .executeTakeFirst();

      if (!userData) {
        return reply.code(401).send(errorResponse('User not found', 'USER_NOT_FOUND'));
      }

      // Check if user has a password (not a social-only account)
      if (!userData.password_hash) {
        return reply.code(401).send(errorResponse('This account was created with Google. Please log in with Google.', 'SOCIAL_ONLY_ACCOUNT'));
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash);

      if (!isCurrentPasswordValid) {
        return reply.code(401).send(errorResponse('Current password is incorrect', 'INVALID_CURRENT_PASSWORD'));
      }

      // Prevent setting the same password
      const isSamePassword = await bcrypt.compare(newPassword, userData.password_hash);
      if (isSamePassword) {
        return reply.code(422).send(errorResponse('New password cannot be the same as current password', 'SAME_PASSWORD'));
      }

      // Hash the new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password in database
      await fastify.kysely
        .updateTable('users')
        .set({
          password_hash: newPasswordHash,
          updated_at: new Date()
        })
        .where('id', '=', user.id)
        .execute();

      return reply.code(200).send(emptySuccessResponse('Password updated successfully'));
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send(errorResponse('Failed to update password', 'UPDATE_PASSWORD_FAILED'));
    }
  });
};

export default updatePassword;
