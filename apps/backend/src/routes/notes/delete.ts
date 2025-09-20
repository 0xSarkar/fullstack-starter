import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { errorResponse, DefaultErrorResponseSchema, NoteParamsSchema, DeleteNoteResponseSchema } from '@fullstack-starter/shared-schemas';

const DeleteSchema = {
  params: NoteParamsSchema,
  response: {
    200: DeleteNoteResponseSchema,
    default: DefaultErrorResponseSchema
  }
};

const del: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.delete('/:id', {
    schema: DeleteSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Perform delete once and return the deleted id (Postgres RETURNING)
      const deleted = await fastify.kysely
        .deleteFrom('notes')
        .where('id', '=', id)
        .where('user_id', '=', userId)
        .returning(['id'])
        .executeTakeFirst();

      if (!deleted) {
        return reply.code(404).send(errorResponse('Note not found', 'NOTE_NOT_FOUND'));
      }

      return reply.code(200).send({
        success: true as const,
        data: null
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send(errorResponse('Failed to delete note', 'DELETE_NOTE_FAILED'));
    }
  });
};

export default del;
