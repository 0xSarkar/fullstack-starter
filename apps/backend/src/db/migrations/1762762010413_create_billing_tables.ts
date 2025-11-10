import type { Kysely } from 'kysely';
import { sql } from 'kysely';

/**
 * Billing/Stripe Integration Migration
 * Creates tables for managing Stripe subscriptions, products, prices, and webhook events
 */

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  // Create stripe_subscription_status enum type
  await db.schema
    .createType('stripe_subscription_status')
    .asEnum([
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    ])
    .execute();

  // Create stripe_prices table to store Stripe product/price metadata
  await db.schema
    .createTable('stripe_prices')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('stripe_product_id', 'text', (col) => col.notNull())
    .addColumn('stripe_price_id', 'text', (col) => col.notNull())
    .addColumn('price_code', 'text')
    .addColumn('price_name', 'text')
    .addColumn('product_code', 'text')
    .addColumn('product_name', 'text')
    .addColumn('amount', 'integer')
    .addColumn('currency', 'text')
    .addColumn('interval', 'text')
    .addColumn('active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Create unique index on stripe_price_id for fast lookups
  await db.schema
    .createIndex('idx_stripe_prices_price_id')
    .unique()
    .on('stripe_prices')
    .column('stripe_price_id')
    .execute();

  // Create index on stripe_product_id
  await db.schema
    .createIndex('idx_stripe_prices_product_id')
    .on('stripe_prices')
    .column('stripe_product_id')
    .execute();

  // Create stripe_subscriptions table to track user subscriptions
  await db.schema
    .createTable('stripe_subscriptions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('stripe_subscription_id', 'text', (col) => col.notNull())
    .addColumn('stripe_product_id', 'text', (col) => col.notNull())
    .addColumn('stripe_price_id', 'text', (col) => col.notNull())
    .addColumn('status', sql`stripe_subscription_status`, (col) => col.notNull())
    .addColumn('current_period_start', 'timestamptz')
    .addColumn('current_period_end', 'timestamptz')
    .addColumn('cancel_at_period_end', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Create unique index on stripe_subscription_id
  await db.schema
    .createIndex('idx_stripe_subscriptions_subscription_id')
    .unique()
    .on('stripe_subscriptions')
    .column('stripe_subscription_id')
    .execute();

  // Create index on user_id
  await db.schema
    .createIndex('idx_stripe_subscriptions_user_id')
    .on('stripe_subscriptions')
    .column('user_id')
    .execute();

  // Add foreign key to stripe_prices on stripe_price_id
  await sql`
		ALTER TABLE stripe_subscriptions
		ADD CONSTRAINT stripe_subscriptions_price_id_fkey
		FOREIGN KEY (stripe_price_id)
		REFERENCES stripe_prices(stripe_price_id)
		ON DELETE RESTRICT;
	`.execute(db);

  // Create stripe_webhook_events table for deduplication
  await db.schema
    .createTable('stripe_webhook_events')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('stripe_event_id', 'text', (col) => col.notNull())
    .addColumn('event_type', 'text', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('processed_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Create unique index on stripe_event_id for deduplication
  await db.schema
    .createIndex('idx_stripe_webhook_events_event_id')
    .unique()
    .on('stripe_webhook_events')
    .column('stripe_event_id')
    .execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order (respecting foreign key dependencies)
  await db.schema.dropTable('stripe_webhook_events').ifExists().execute();
  await db.schema.dropTable('stripe_subscriptions').ifExists().execute();
  await db.schema.dropTable('stripe_prices').ifExists().execute();

  // Drop the enum type
  await db.schema.dropType('stripe_subscription_status').ifExists().execute();
}
