import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { successResponse, errorResponse, wrapSuccessResponseSchema, wrapErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { NoteParamsSchema, UpdateNoteRequestSchema, UpdateNoteResponseSchema } from '@fullstack-starter/shared-schemas';

const UpdateSchema = {
  params: NoteParamsSchema,
  body: UpdateNoteRequestSchema,
  response: {
    200: wrapSuccessResponseSchema(UpdateNoteResponseSchema),
    default: wrapErrorResponseSchema()
  }
};

const update: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.patch('/:id', {
    schema: UpdateSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;
      const body = request.body as { title?: string; content?: string; };
      const { title, content } = body;

      // perform update
      const updateData: any = {
        updated_at: new Date() as any
      };
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;

      const updated = await fastify.kysely
        .updateTable('notes')
        .set(updateData)
        .where('id', '=', id)
        .where('user_id', '=', userId)
        .returning(['id', 'title', 'content', 'updated_at'])
        .executeTakeFirst();

      if (!updated) {
        return reply.code(404).send(errorResponse('Note not found', 'NOTE_NOT_FOUND'));
      }

      const response = {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        updatedAt: typeof updated.updated_at === 'string' ? updated.updated_at : new Date(updated.updated_at as any).toISOString()
      };

      return reply.code(200).send(successResponse(response));
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send(errorResponse('Failed to update note', 'UPDATE_NOTE_FAILED'));
    }
  });
};

export default update;
