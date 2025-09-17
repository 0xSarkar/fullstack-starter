import jwt from '@fastify/jwt';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  // Register @fastify/jwt with configuration
  await fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET,

    // Global signing options
    sign: {
      expiresIn: fastify.config.JWT_EXPIRES_IN || '30d'
    },

    // Cookie configuration for cross-subdomain support
    cookie: {
      cookieName: 'authToken',
      signed: false
    },

    // Custom error messages
    messages: {
      badRequestErrorMessage: 'Invalid token format',
      badCookieRequestErrorMessage: 'Invalid token in cookie',
      noAuthorizationInHeaderMessage: 'Missing authorization header',
      noAuthorizationInCookieMessage: 'Missing authorization cookie',
      authorizationTokenExpiredMessage: 'Token has expired',
      authorizationTokenInvalid: (err) => `Invalid token: ${err.message}`,
      authorizationTokenUntrusted: 'Untrusted token'
    }
  });

  // Helper method to set secure cookies with cross-subdomain support
  fastify.decorateReply('setAuthCookie', function (token: string) {
    const isProduction = fastify.config.NODE_ENV === 'production';

    this.setCookie('authToken', token, {
      httpOnly: true,                              // Prevent XSS
      secure: isProduction,                        // HTTPS only in production
      sameSite: isProduction ? 'none' : 'lax',    // Use 'lax' for local dev, 'none' for production cross-site
      domain: isProduction ? fastify.config.COOKIE_DOMAIN : undefined, // Cross-subdomain in production
      maxAge: 30 * 24 * 60 * 60,                    // 30 days in seconds
      path: '/'
    });
  });

  // Helper method to clear auth cookie
  fastify.decorateReply('clearAuthCookie', function () {
    const isProduction = fastify.config.NODE_ENV === 'production';

    this.clearCookie('authToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: isProduction ? fastify.config.COOKIE_DOMAIN : undefined,
      path: '/'
    });
  });
};

export default fp(jwtPlugin, {
  name: 'jwt',
  dependencies: ['config', 'cookie'] // Ensure config plugin is loaded first
});

// Type declarations for our custom decorators
declare module 'fastify' {
  export interface FastifyReply {
    setAuthCookie(token: string): void;
    clearAuthCookie(): void;
  }
}
