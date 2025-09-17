import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { emptySuccessResponse, errorResponse, wrapEmptySuccessResponseSchema, wrapErrorResponseSchema } from '@fullstack-starter/api-schema';
import { ResetPasswordRequestSchema } from '@fullstack-starter/api-schema';

const ResetSchema = {
  body: ResetPasswordRequestSchema,
  response: {
    200: wrapEmptySuccessResponseSchema(),
    default: wrapErrorResponseSchema()
  }
};

const resetPassword: FastifyPluginAsyncTypebox = async (fastify, opts): Promise<void> => {
  fastify.post('/reset-password', { schema: ResetSchema }, async function (request, reply) {
    const { token, newPassword, confirmPassword } = request.body;

    if (newPassword !== confirmPassword) {
      return reply.code(422).send(errorResponse('Passwords do not match', 'PASSWORD_MISMATCH'));
    }

    try {
      // Hash provided token to compare
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find token row joined with user to validate ownership and expiry
      const row = await fastify.kysely
        .selectFrom('password_reset_tokens')
        .innerJoin('users', 'password_reset_tokens.user_id', 'users.id')
        .select([
          'password_reset_tokens.id as token_id',
          'password_reset_tokens.expires_at',
          'password_reset_tokens.used',
          'users.id as user_id',
          'users.email',
          'users.password_hash'
        ])
        .where('password_reset_tokens.token_hash', '=', tokenHash)
        .executeTakeFirst();

      if (!row) {
        return reply.code(401).send(errorResponse('Invalid or expired token', 'INVALID_TOKEN'));
      }

      if (row.used) {
        return reply.code(401).send(errorResponse('Token has already been used', 'TOKEN_USED'));
      }

      const now = new Date();
      if (row.expires_at && new Date(row.expires_at) < now) {
        return reply.code(401).send(errorResponse('Token has expired', 'TOKEN_EXPIRED'));
      }

      // Disallow reusing the same password (only if user has a password)
      let isSame = false;
      if (row.password_hash) {
        isSame = await bcrypt.compare(newPassword, row.password_hash);
      }
      if (isSame) {
        return reply.code(422).send(errorResponse('New password must be different from the old password', 'SAME_PASSWORD'));
      }

      const saltRounds = 12;
      const newHash = await bcrypt.hash(newPassword, saltRounds);

      // Update user's password and mark token as used in a transaction
      await fastify.kysely.transaction().execute(async (trx) => {
        await trx
          .updateTable('users')
          .set({ password_hash: newHash })
          .where('id', '=', row.user_id)
          .execute();

        await trx
          .updateTable('password_reset_tokens')
          .set({ used: true, used_at: new Date() })
          .where('id', '=', row.token_id)
          .execute();
      });

      // Do not auto-login after password reset
      return reply.code(200).send(emptySuccessResponse('Password updated successfully'));
    } catch (err) {
      fastify.log.error({ err }, 'Reset password error');
      return reply.code(500).send(errorResponse('Failed to reset password', 'RESET_PASSWORD_FAILED'));
    }
  });
};

export default resetPassword;
