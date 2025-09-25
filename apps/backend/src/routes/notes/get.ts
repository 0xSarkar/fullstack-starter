import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { errorResponse, DefaultErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { NoteParamsSchema, GetNoteResponseSchema } from '@fullstack-starter/shared-schemas';
import { normalizeTimestamp } from '../../utils/timestamps.js';

const GetSchema = {
  params: NoteParamsSchema,
  response: {
    200: GetNoteResponseSchema,
    default: DefaultErrorResponseSchema
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
        createdAt: normalizeTimestamp(row.created_at),
        updatedAt: normalizeTimestamp(row.updated_at)
      };

      return reply.code(200).send({
        success: true as const,
        data: response
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send(errorResponse('Failed to fetch note', 'FETCH_NOTE_FAILED'));
    }
  });
};

export default getNote;
