import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Core Schema Migration
 * Creates the foundational database schema including:
 * - User roles enum
 * - Users table with authentication and role support
 * - User providers table for OAuth (Google, etc.)
 * - Password reset tokens table
 * - Timestamp update trigger function
 */

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  // Create user_role enum type
  await db.schema
    .createType('user_role')
    .asEnum(['user', 'admin', 'super_admin'])
    .execute();

  // Create trigger function to maintain updated_at timestamp
  await sql`
		CREATE OR REPLACE FUNCTION update_updated_at_column()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at := now();
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;
	`.execute(db);

  // Create users table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)') // Nullable for OAuth users
    .addColumn('display_name', 'text')
    .addColumn('role', sql`user_role`, (col) => col.notNull().defaultTo('user'))
    .addColumn('active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('stripe_customer_id', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Create indexes on users table
  await db.schema
    .createIndex('idx_users_email')
    .on('users')
    .column('email')
    .execute();

  await db.schema
    .createIndex('idx_users_role')
    .on('users')
    .column('role')
    .execute();

  await db.schema
    .createIndex('idx_users_active')
    .on('users')
    .column('active')
    .execute();

  // Create trigger for users.updated_at
  await sql`
		CREATE TRIGGER update_users_updated_at
		BEFORE UPDATE ON users
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();
	`.execute(db);

  // Create user_providers table for OAuth
  await db.schema
    .createTable('user_providers')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('provider', 'text', (col) => col.notNull())
    .addColumn('provider_user_id', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Create unique indexes on user_providers
  await db.schema
    .createIndex('idx_user_providers_provider_pair')
    .unique()
    .on('user_providers')
    .columns(['provider', 'provider_user_id'])
    .execute();

  await db.schema
    .createIndex('idx_user_providers_user_provider')
    .unique()
    .on('user_providers')
    .columns(['user_id', 'provider'])
    .execute();

  // Create password_reset_tokens table
  await db.schema
    .createTable('password_reset_tokens')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('token_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('used', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('used_at', 'timestamptz')
    .execute();

  // Create indexes on password_reset_tokens
  await db.schema
    .createIndex('idx_password_reset_tokens_user_id')
    .on('password_reset_tokens')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_password_reset_tokens_token_hash')
    .on('password_reset_tokens')
    .column('token_hash')
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order (respecting foreign key dependencies)
  await db.schema.dropTable('password_reset_tokens').ifExists().execute();
  await db.schema.dropTable('user_providers').ifExists().execute();

  // Drop trigger and function before dropping users table
  await sql`DROP TRIGGER IF EXISTS update_users_updated_at ON users`.execute(db);

  await db.schema.dropTable('users').ifExists().execute();

  // Drop the trigger function
  await sql`DROP FUNCTION IF EXISTS update_updated_at_column()`.execute(db);

  // Drop the enum type
  await db.schema.dropType('user_role').ifExists().execute();
}
