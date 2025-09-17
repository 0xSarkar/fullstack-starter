import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { errorResponse, wrapErrorResponseSchema, wrapPaginatedResponseSchema, paginatedResponse } from '@fullstack-starter/api-schema';
import { ListNotesQuerySchema, NoteItemSchema } from '@fullstack-starter/api-schema';

const ListSchema = {
  querystring: ListNotesQuerySchema,
  response: {
    200: wrapPaginatedResponseSchema(NoteItemSchema),
    default: wrapErrorResponseSchema()
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
        .select(fastify.kysely.fn.count('id').as('cnt'))
        .where('user_id', '=', userId)
        .executeTakeFirst();

      const total = Number((totalRes as any)?.cnt ?? 0);

      const rows = await fastify.kysely
        .selectFrom('notes')
        .select(['id', 'title', 'content', 'created_at', 'updated_at'])
        .where('user_id', '=', userId)
        .orderBy('updated_at', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      const items = rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at as any).toISOString(),
        updatedAt: typeof r.updated_at === 'string' ? r.updated_at : new Date(r.updated_at as any).toISOString()
      }));

      return reply.code(200).send(paginatedResponse(items, { page, limit, total }));
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send(errorResponse('Failed to list notes', 'LIST_NOTES_FAILED'));
    }
  });
};

export default list;
