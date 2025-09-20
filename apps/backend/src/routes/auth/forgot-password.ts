import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import crypto from 'crypto';
import { errorResponse, ForgotPasswordRequestSchema, ForgotPasswordResponseSchema } from '@fullstack-starter/shared-schemas';

const ForgotSchema = {
  body: ForgotPasswordRequestSchema,
  response: {
    200: ForgotPasswordResponseSchema,
    default: {
      success: { type: 'boolean', enum: [false] },
      error: { type: 'string' },
      code: { type: 'string', nullable: true },
      details: { type: 'object', nullable: true }
    }
  }
};

const forgotPassword: FastifyPluginAsyncTypebox = async (fastify, opts): Promise<void> => {
  fastify.post('/forgot-password', { schema: ForgotSchema }, async function (request, reply) {
    const { email } = request.body;

    try {
      const user = await fastify.kysely
        .selectFrom('users')
        .select(['id', 'email'])
        .where('email', '=', email)
        .executeTakeFirst();

      // Always respond with a generic message to avoid user enumeration
      const genericResponse = {
        success: true as const,
        data: null,
        message: 'If an account exists, a password reset link has been sent'
      };

      if (!user) {
        // Still return 200 with generic message
        return reply.code(200).send(genericResponse);
      }

      // Generate secure random token (url-safe)
      const tokenBuffer = crypto.randomBytes(48);
      const token = tokenBuffer.toString('base64url');

      // Hash the token before storing (SHA256)
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const expiresAt = new Date(Date.now() + (fastify.config.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES || 60) * 60 * 1000);

      // Store token hash in password_reset_tokens table
      await fastify.kysely
        .insertInto('password_reset_tokens')
        .values({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt })
        .execute();

      // Build reset link
      const frontend = fastify.config.FRONTEND_URL || `${request.protocol}://${request.hostname}`;
      const resetUrl = `${frontend.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

      // Send email (fire-and-forget)
      const html = `<p>A password reset was requested for your account. Click the link below to reset your password. If you didn't request this, you can ignore this email.</p>
<p><a href="${resetUrl}">Reset password</a></p>`;

      try {
        await fastify.sendEmail(user.email, 'Password reset', html);
      } catch (err) {
        fastify.log.warn({ err }, 'Failed to send password reset email');
        // Do not expose email errors to the client
      }

      return reply.code(200).send(genericResponse);
    } catch (err) {
      fastify.log.error({ err }, 'Forgot password error');
      return reply.code(500).send(errorResponse('Failed to process request', 'FORGOT_PASSWORD_FAILED'));
    }
  });
};

export default forgotPassword;
