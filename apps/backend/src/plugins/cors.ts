import fp from 'fastify-plugin';
import cors from '@fastify/cors';

export default fp(async (fastify) => {
  await fastify.register(cors, {
    // Allow requests from configured origins
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      const hostname = new URL(origin).hostname;

      // Allow localhost and 127.0.0.1 for development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return callback(null, true);
      }

      // In production, allow only the configured FRONTEND_URL.
      if (fastify.config.NODE_ENV === 'production') {
        if (fastify.config.FRONTEND_URL) {
          return callback(null, origin === fastify.config.FRONTEND_URL);
        }

        // Deny all in production if FRONTEND_URL is not set
        return callback(null, false);
      }

      // Allow all origins in development
      return callback(null, true);
    },

    // Allow credentials (cookies, authorization headers)
    credentials: true,

    // Allow common HTTP methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    // Allow common headers
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ]
  });
}, {
  name: 'cors',
  dependencies: ['config'] // Ensure config is loaded first
});
