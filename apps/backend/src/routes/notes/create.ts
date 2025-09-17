import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { successResponse, errorResponse, wrapSuccessResponseSchema, wrapErrorResponseSchema } from '@fullstack-starter/api-schema';
import { CreateNoteRequestSchema, CreateNoteResponseSchema } from '@fullstack-starter/api-schema';

const CreateSchema = {
  body: CreateNoteRequestSchema,
  response: {
    201: wrapSuccessResponseSchema(CreateNoteResponseSchema),
    default: wrapErrorResponseSchema()
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

      return reply.code(201).send(successResponse(response));
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send(errorResponse('Failed to create note', 'CREATE_NOTE_FAILED'));
    }
  });
};

export default create;
