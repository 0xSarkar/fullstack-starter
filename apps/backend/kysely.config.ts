import { Pool } from 'pg';
import { PostgresDialect } from 'kysely';
import { defineConfig } from 'kysely-ctl';

export default defineConfig({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
  migrations: {
    migrationFolder: "db/migrations",
  },
  seeds: {
    seedFolder: "db/seeds",
  }
  //   plugins: [],
});
