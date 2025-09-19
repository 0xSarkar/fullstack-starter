import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { successResponse, errorResponse, wrapSuccessResponseSchema, wrapErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { NoteParamsSchema, NoteDataSchema } from '@fullstack-starter/shared-schemas';

const GetSchema = {
  params: NoteParamsSchema,
  response: {
    200: wrapSuccessResponseSchema(NoteDataSchema),
    default: wrapErrorResponseSchema()
  }
};

const getNote: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get('/:id', {
    schema: GetSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      const row = await fastify.kysely
        .selectFrom('notes')
        .select(['id', 'title', 'content', 'created_at', 'updated_at'])
        .where('id', '=', id)
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!row) {
        return reply.code(404).send(errorResponse('Note not found', 'NOTE_NOT_FOUND'));
      }

      const response = {
        id: row.id,
        title: row.title,
        content: row.content,
        createdAt: typeof row.created_at === 'string' ? row.created_at : new Date(row.created_at as any).toISOString(),
        updatedAt: typeof row.updated_at === 'string' ? row.updated_at : new Date(row.updated_at as any).toISOString()
      };

      return reply.code(200).send(successResponse(response));
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send(errorResponse('Failed to fetch note', 'FETCH_NOTE_FAILED'));
    }
  });
};

export default getNote;
