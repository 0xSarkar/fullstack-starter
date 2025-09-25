import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { errorResponse, DefaultErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { CreateNoteRequestSchema, CreateNoteResponseSchema } from '@fullstack-starter/shared-schemas';
import { normalizeTimestamp } from '../../utils/timestamps.js';

const CreateSchema = {
  body: CreateNoteRequestSchema,
  response: {
    201: CreateNoteResponseSchema,
    default: DefaultErrorResponseSchema
  }
};

const create: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post('/', {
    schema: CreateSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    const body = request.body;
    const title = body.title;
    const content = body.content;

    try {
      const userId = request.user.id;

      // Insert into DB
      const inserted = await fastify.kysely
        .insertInto('notes')
        .values({
          user_id: userId,
          title: title || null,
          content: content || null
        })
        .returning(['id', 'title', 'content', 'created_at'])
        .executeTakeFirstOrThrow();

      const response = {
        id: inserted.id,
        title: inserted.title,
        content: inserted.content,
        createdAt: normalizeTimestamp(inserted.created_at)
      };

      return reply.code(201).send({
        success: true as const,
        data: response
      });
    } catch (err: unknown) {
      fastify.log.error({ err }, 'Failed to create note');
      return reply.code(500).send(errorResponse('Failed to create note', 'CREATE_NOTE_FAILED'));
    }
  });
};

export default create;
