import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { errorResponse } from '@fullstack-starter/shared-schemas';
import "@fastify/jwt"; // imported due to module augmentation (at the end)

// Type definition for JWT payload
export interface JWTPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Type definition for authenticated user
export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Authentication decorator for protecting routes
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Try to verify JWT token (supports both cookie and bearer token)
      await request.jwtVerify();

      // Fetch user from database to verify they're still active
      const user = await fastify.kysely
        .selectFrom('users')
        .select(['id', 'email', 'active'])
        .where('id', '=', request.user.id)
        .executeTakeFirst();

      if (!user) {
        return reply.code(401).send(errorResponse('User not found'));
      }

      // Check if user is active
      if (!user.active) {
        return reply.code(401).send(errorResponse('Account has been deactivated'));
      }

      // If successful, request.user will be populated with the JWT payload
      // No additional action needed - @fastify/jwt handles this automatically
    } catch (err: any) {
      // Handle different types of authentication errors
      if (err.code === 'FST_JWT_NO_AUTHORIZATION_IN_COOKIE' ||
        err.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
        // No token found in either cookie or header
        return reply.code(401).send(errorResponse('Authentication required'));
      }

      if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
        // Token has expired
        return reply.code(401).send(errorResponse('Token has expired'));
      }

      if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        // Invalid token
        return reply.code(401).send(errorResponse('Invalid authentication token'));
      }

      if (err.code === 'FST_JWT_BAD_REQUEST' || err.code === 'FST_JWT_BAD_COOKIE_REQUEST') {
        // Malformed token
        return reply.code(400).send(errorResponse('Malformed authentication token'));
      }

      // Generic authentication error
      fastify.log.error('Authentication error:', err);
      return reply.code(401).send(errorResponse('Authentication failed'));
    }
  });

  // Optional: Soft authentication decorator (doesn't fail if no token)
  fastify.decorate('authenticateOptional', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      // If successful, request.user will be populated
    } catch (err) {
      // Silently fail - request.user will be undefined
      // This allows routes to handle both authenticated and unauthenticated users
    }
  });

  // Helper to create JWT payload from user data
  fastify.decorate('createJWTPayload', function (user: { id: string; email: string; }): JWTPayload {
    return {
      id: user.id,
      email: user.email
    };
  });

  // Admin authentication decorator for admin-only routes
  fastify.decorate('authenticateAdmin', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // First, verify the JWT token
      await request.jwtVerify();

      // Fetch user from database to get role information
      const user = await fastify.kysely
        .selectFrom('users')
        .select(['id', 'email', 'role', 'active'])
        .where('id', '=', request.user.id)
        .executeTakeFirst();

      if (!user) {
        return reply.code(401).send(errorResponse('User not found'));
      }

      // Check if user is active
      if (!user.active) {
        return reply.code(401).send(errorResponse('Account has been deactivated'));
      }

      // Check if user has admin or super_admin role
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return reply.code(403).send(errorResponse('Admin access required'));
      }

      // Add role to the request user object for use in handlers
      request.user.role = user.role;
    } catch (err: any) {
      // Handle JWT verification errors (same as authenticate)
      if (err.code === 'FST_JWT_NO_AUTHORIZATION_IN_COOKIE' ||
        err.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
        return reply.code(401).send(errorResponse('Authentication required'));
      }

      if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
        return reply.code(401).send(errorResponse('Token has expired'));
      }

      if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
        return reply.code(401).send(errorResponse('Invalid authentication token'));
      }

      if (err.code === 'FST_JWT_BAD_REQUEST' || err.code === 'FST_JWT_BAD_COOKIE_REQUEST') {
        return reply.code(400).send(errorResponse('Malformed authentication token'));
      }

      // Generic authentication error
      fastify.log.error('Admin authentication error:', err);
      return reply.code(401).send(errorResponse('Authentication failed'));
    }
  });
};

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['config', 'cookie', 'jwt'] // Ensure dependency plugins are loaded first
});

// Extend Fastify types
declare module 'fastify' {
  export interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    authenticateOptional(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    authenticateAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    createJWTPayload(user: { id: string; email: string; }): JWTPayload;
  }
}

// Extend @fastify/jwt types for our user structure
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: AuthenticatedUser;
  }
}
