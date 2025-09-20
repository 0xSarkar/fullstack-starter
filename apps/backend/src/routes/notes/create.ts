import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { errorResponse } from '@fullstack-starter/shared-schemas';
import { CreateNoteRequestSchema, CreateNoteResponseSchema } from '@fullstack-starter/shared-schemas';

const CreateSchema = {
  body: CreateNoteRequestSchema,
  response: {
    201: CreateNoteResponseSchema,
    default: {
      success: { type: 'boolean', enum: [false] },
      error: { type: 'string' },
      code: { type: 'string', nullable: true },
      details: { type: 'object', nullable: true }
    }
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
        createdAt: typeof inserted.created_at === 'string' ? inserted.created_at : new Date(inserted.created_at as any).toISOString()
      };

      return reply.code(201).send({
        success: true as const,
        data: response
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send(errorResponse('Failed to create note', 'CREATE_NOTE_FAILED'));
    }
  });
};

export default create;
