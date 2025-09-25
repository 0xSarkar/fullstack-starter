import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { errorResponse, DefaultErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { NoteParamsSchema, UpdateNoteRequestSchema, UpdateNoteResponseSchema } from '@fullstack-starter/shared-schemas';
import { normalizeTimestamp } from '../../utils/timestamps.js';
import type { Notes } from '../../types/database.js';
import type { Updateable } from 'kysely';

const UpdateSchema = {
  params: NoteParamsSchema,
  body: UpdateNoteRequestSchema,
  response: {
    200: UpdateNoteResponseSchema,
    default: DefaultErrorResponseSchema
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
      const updateData: Partial<Updateable<Notes>> = {
        updated_at: new Date()
      };
      if (title !== undefined) updateData.title = title ?? null;
      if (content !== undefined) updateData.content = content ?? null;

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
        updatedAt: normalizeTimestamp(updated.updated_at)
      };

      return reply.code(200).send({
        success: true as const,
        data: response
      });
    } catch (err: unknown) {
      fastify.log.error({ err }, 'Failed to update note');
      return reply.code(500).send(errorResponse('Failed to update note', 'UPDATE_NOTE_FAILED'));
    }
  });
};

export default update;
