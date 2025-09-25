import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { errorResponse, DefaultErrorResponseSchema } from '@fullstack-starter/shared-schemas';
import { ListUsersQuerySchema, ListUsersResponseSchema } from '@fullstack-starter/shared-schemas';

const ListUsersSchema = {
  querystring: ListUsersQuerySchema,
  response: {
    200: ListUsersResponseSchema,
    401: DefaultErrorResponseSchema,
    403: DefaultErrorResponseSchema,
    default: DefaultErrorResponseSchema
  }
};

const listUsers: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  fastify.get('/users', {
    schema: ListUsersSchema,
    onRequest: fastify.authenticateAdmin
  }, async function (request, reply) {
    try {
      const { page = 1, limit = 20, role, search } = request.query;
      const offset = (page - 1) * limit;

      // Build a base filtered query (without selects yet)
      let filtered = fastify.kysely
        .selectFrom('users');

      // Apply filters
      if (role) {
        filtered = filtered.where('role', '=', role);
      }

      if (search) {
        filtered = filtered.where((eb) =>
          eb.or([
            eb('email', 'ilike', `%${search}%`),
            eb('display_name', 'ilike', `%${search}%`)
          ])
        );
      }

      // Get total count for pagination (separate aggregate query)
      const countResult = await filtered
        .select(({ fn }) => fn.countAll<string>().as('count'))
        .executeTakeFirst();
      const total = countResult ? Number(countResult.count) : 0;

      // Get paginated results (select concrete columns after filtering)
      const usersRaw = await filtered
        .select([
          'id',
          'email',
          'display_name',
          'role',
          'active',
          'created_at',
          'updated_at',
          'stripe_customer_id'
        ])
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();

      // Convert dates to strings for API response
      const users = usersRaw.map(user => ({
        ...user,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString()
      }));

      return reply.code(200).send({
        success: true as const,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error: any) {
      fastify.log.error('Error listing users:', error);
      return reply.code(500).send(errorResponse('Failed to list users'));
    }
  });
};

export default listUsers;
