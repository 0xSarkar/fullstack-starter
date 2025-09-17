import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Kysely, PostgresDialect, CompiledQuery } from 'kysely';
import { Pool } from 'pg';
import { DB } from '../types/database.js';

const kyselyPlugin: FastifyPluginAsync = async (fastify) => {
  // Create Kysely instance with PostgreSQL dialect
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: fastify.config.DATABASE_URL,
      }),
    }),
  });

  // Decorate fastify instance with the db
  fastify.decorate('kysely', db);

  // Test database connection on startup
  try {
    // Simple connection test using CompiledQuery.raw
    await fastify.kysely.executeQuery<{ connected: number; }>(
      CompiledQuery.raw("SELECT 1 as connected", [])
    );

    const { rows: versionResult } = await fastify.kysely.executeQuery<{ pg_version: string; }>(
      CompiledQuery.raw("SELECT version() as pg_version", [])
    );

    fastify.log.info({
      database: 'connected',
      postgres_version: versionResult[0]?.pg_version?.split(' ').slice(0, 2).join(' ') || 'unknown'
    }, 'Database connection established successfully');
  } catch (error) {
    fastify.log.error({ error }, 'Failed to connect to database');
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Gracefully close the database connection on app shutdown
  fastify.addHook('onClose', async () => {
    await fastify.kysely.destroy();
  });
};

// Extend Fastify types to include the kysely decorator
declare module 'fastify' {
  interface FastifyInstance {
    kysely: Kysely<DB>;
  }
}

export default fp(kyselyPlugin, {
  name: 'kysely'
});
