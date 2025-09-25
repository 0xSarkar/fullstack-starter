import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

/**
 * This plugin adds a catch-all content type parser to handle requests
 * without a Content-Type header or with unsupported content types.
 * This prevents "Unsupported Media Type" errors when the frontend
 * conditionally sets Content-Type headers.
 */
const contentTypeParserPlugin: FastifyPluginAsync = async (fastify) => {
  // Add a catch-all content type parser for requests without Content-Type header
  fastify.addContentTypeParser('*', function (request, payload, done) {
    // For requests without a Content-Type header, we need to handle the body appropriately
    const contentType = request.headers['content-type'];

    if (!contentType) {
      // If no Content-Type header, assume JSON for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        let body = '';
        payload.on('data', chunk => {
          body += chunk;
        });
        payload.on('end', () => {
          try {
            // Try to parse as JSON
            const parsed = body ? JSON.parse(body) : {};
            done(null, parsed);
          } catch {
            // If JSON parsing fails, return the raw body as a string
            done(null, body);
          }
        });
        payload.on('error', done);
      } else {
        // For other methods, don't parse the body
        done(null, null);
      }
    } else {
      // If Content-Type is present but not supported, try to parse as JSON anyway
      let body = '';
      payload.on('data', chunk => {
        body += chunk;
      });
      payload.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          done(null, parsed);
        } catch (error) {
          done(error instanceof Error ? error : new Error('Failed to parse request body'), null);
        }
      });
      payload.on('error', done);
    }
  });
};

export default fp(contentTypeParserPlugin, {
  name: 'content-type-parser'
});