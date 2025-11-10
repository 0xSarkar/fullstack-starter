import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Notes Feature Migration
 * Creates the notes table for user-generated content
 */

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  // Create notes table
  await db.schema
    .createTable('notes')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('title', 'varchar(255)')
    .addColumn('content', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Create index on user_id for efficient queries
  await db.schema
    .createIndex('idx_notes_user_id')
    .on('notes')
    .column('user_id')
    .execute();

  // Create trigger for notes.updated_at
  await sql`
		CREATE TRIGGER update_notes_updated_at
		BEFORE UPDATE ON notes
		FOR EACH ROW
		EXECUTE FUNCTION update_updated_at_column();
	`.execute(db);
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  // Drop trigger first
  await sql`DROP TRIGGER IF EXISTS update_notes_updated_at ON notes`.execute(db);

  // Drop the table
  await db.schema.dropTable('notes').ifExists().execute();
}
