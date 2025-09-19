import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { errorResponse } from '@fullstack-starter/shared-schemas';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    // Log error for debugging (in production, you might want to use a proper logger)
    fastify.log.error(error);

    // TypeBox validation error
    if (error.validation) {
      const errorMessages: Record<string, string> = {
        format: 'Invalid format',
        minLength: 'Too short',
        maxLength: 'Too long',
        minimum: 'Value too small',
        maximum: 'Value too large',
        required: 'Required field',
        pattern: 'Invalid format',
        type: 'Invalid type'
      };

      const fieldErrors = error.validation.map(err => {
        let fieldName = 'unknown';

        // For required field errors, the field name is in err.params.missingProperty
        if (err.keyword === 'required' && err.params && 'missingProperty' in err.params) {
          fieldName = err.params.missingProperty as string;
        }
        // For other validation errors, extract from instancePath
        else if (err.instancePath) {
          fieldName = err.instancePath.replace(/^\//, '') || 'unknown';
        }
        // Fallback: try to extract from schemaPath
        else if (err.schemaPath) {
          const pathParts = err.schemaPath.split('/');
          fieldName = pathParts[pathParts.length - 1] || 'unknown';
        }

        return {
          field: fieldName,
          message: errorMessages[err.keyword] || err.message || 'Validation error'
        };
      });

      return reply.code(400).send(errorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        { errors: fieldErrors }
      ));
    }

    // Fastify built-in errors (like route not found)
    if (error.statusCode) {
      const message = error.message || 'An error occurred';
      const code = error.statusCode === 404 ? 'NOT_FOUND' :
        error.statusCode === 401 ? 'UNAUTHORIZED' :
          error.statusCode === 403 ? 'FORBIDDEN' : undefined;
      return reply.code(error.statusCode).send(errorResponse(message, code));
    }

    // Generic internal server error
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message || 'Internal server error';

    return reply.code(500).send(errorResponse(message, 'INTERNAL_ERROR'));
  });
};

export default fp(errorHandlerPlugin, {
  name: 'error-handler'
});