import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { errorResponse, DefaultErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { ListNotesQuerySchema, ListNotesResponseSchema } from '@fullstack-starter/shared-schemas';
import { normalizeTimestamp } from '../../utils/timestamps.js';

const ListSchema = {
  querystring: ListNotesQuerySchema,
  response: {
    200: ListNotesResponseSchema,
    default: DefaultErrorResponseSchema
  }
};

const list: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get('/', {
    schema: ListSchema,
    onRequest: fastify.authenticate
  }, async function (request, reply) {
    try {
      const qs = request.query;
      const page = qs.page && qs.page >= 1 ? qs.page : 1;
      const limit = qs.limit && qs.limit >= 1 && qs.limit <= 100 ? qs.limit : 20;
      const offset = (page - 1) * limit;

      const userId = request.user.id;

      // total count
      const totalRes = await fastify.kysely
        .selectFrom('notes')
        .select(({ fn }) => fn.count<string>('id').as('cnt'))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      const total = totalRes ? Number(totalRes.cnt) : 0;

      const rows = await fastify.kysely
        .selectFrom('notes')
        .select(['id', 'title', 'content', 'created_at', 'updated_at'])
        .where('user_id', '=', userId)
        .orderBy('updated_at', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      const items = rows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: normalizeTimestamp(r.created_at),
        updatedAt: normalizeTimestamp(r.updated_at)
      }));

      return reply.code(200).send({
        success: true as const,
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err: unknown) {
      fastify.log.error({ err }, 'Failed to list notes');
      return reply.code(500).send(errorResponse('Failed to list notes', 'LIST_NOTES_FAILED'));
    }
  });
};

export default list;
