import fastifyEnv from '@fastify/env';
import { Static, Type } from '@sinclair/typebox';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const EnvSchema = Type.Object({
  DATABASE_URL: Type.String(),
  JWT_SECRET: Type.String(),
  JWT_EXPIRES_IN: Type.Optional(Type.String({ default: '30d' })),
  COOKIE_SECRET: Type.String(),
  COOKIE_DOMAIN: Type.String(),
  NODE_ENV: Type.String({ default: 'development' }),
  FRONTEND_URL: Type.String(),
  // Optional email / reset configuration
  SMTP_HOST: Type.Optional(Type.String()),
  SMTP_PORT: Type.Optional(Type.String()),
  SMTP_USER: Type.Optional(Type.String()),
  SMTP_PASS: Type.Optional(Type.String()),
  // Password reset expiry in minutes (default 60 minutes)
  PASSWORD_RESET_TOKEN_EXPIRES_MINUTES: Type.Optional(Type.Number({ default: 60 })),

  // Google OAuth Client ID for verifying Google ID tokens
  GOOGLE_CLIENT_ID: Type.String(),

  STRIPE_SECRET_KEY: Type.String(),
  STRIPE_WEBHOOK_SECRET: Type.String(),
});

type EnvType = Static<typeof EnvSchema>;

const configPlugin: FastifyPluginAsync = async (fastify) => {
  // Determine which env files to load based on NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Load environment files in priority order (highest to lowest priority)
  const envFiles = [
    `.env.${nodeEnv}.local`, // highest priority, git-ignored
    `.env.${nodeEnv}`,       // environment-specific
    '.env.local',            // local overrides, git-ignored  
    '.env'                   // base configuration
  ].filter(Boolean);

  const options = {
    dotenv: {
      path: envFiles
    },
    confKey: 'config', // optional, default: 'config'
    schema: EnvSchema,
  };

  await fastify.register(fastifyEnv, options);
};

export default fp(configPlugin, {
  name: 'config'
});

// fastifyEnv sets fastify.config decorator for us. Declare it's correct typings here.
declare module 'fastify' {
  export interface FastifyInstance {
    config: EnvType;
  }
}

export const autoload = false; // don't autoload this plugin. Manually load early in bootstrap.