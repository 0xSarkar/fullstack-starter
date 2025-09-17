-- migrate:up

ALTER TABLE users ADD COLUMN stripe_customer_id text;

-- Create table to store Stripe product/price metadata
CREATE TABLE public.stripe_prices (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	stripe_product_id text NOT NULL,
	stripe_price_id text NOT NULL,
	price_code text,
	price_name text,
	product_code text,
	product_name text,
	amount integer,
	currency text,
	interval text,
	active boolean DEFAULT true NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.stripe_prices
	ADD CONSTRAINT stripe_prices_pkey PRIMARY KEY (id);

-- Unique constraint on the Stripe price id for fast lookups
CREATE UNIQUE INDEX idx_stripe_prices_price_id ON public.stripe_prices USING btree (stripe_price_id);
CREATE INDEX idx_stripe_prices_product_id ON public.stripe_prices USING btree (stripe_product_id);

-- Create table to track user subscriptions
-- Enum type for subscription status
DO $$ BEGIN
	CREATE TYPE public.stripe_subscription_status AS ENUM ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE public.stripe_subscriptions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	stripe_subscription_id text NOT NULL,
	stripe_product_id text NOT NULL,
	stripe_price_id text NOT NULL,
	status public.stripe_subscription_status NOT NULL,
	current_period_start timestamp with time zone,
	current_period_end timestamp with time zone,
	cancel_at_period_end boolean DEFAULT false NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.stripe_subscriptions
	ADD CONSTRAINT stripe_subscriptions_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX idx_stripe_subscriptions_subscription_id ON public.stripe_subscriptions USING btree (stripe_subscription_id);
CREATE INDEX idx_stripe_subscriptions_user_id ON public.stripe_subscriptions USING btree (user_id);

-- Add foreign key to users table
ALTER TABLE ONLY public.stripe_subscriptions
	ADD CONSTRAINT stripe_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add foreign key to stripe_prices on stripe_price_id (prevents subscriptions pointing to missing prices)
ALTER TABLE ONLY public.stripe_subscriptions
	ADD CONSTRAINT stripe_subscriptions_price_id_fkey FOREIGN KEY (stripe_price_id) REFERENCES public.stripe_prices(stripe_price_id) ON DELETE RESTRICT;

-- Create table to store Stripe webhook events for deduplication
CREATE TABLE public.stripe_webhook_events (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	stripe_event_id text NOT NULL,
	event_type text NOT NULL,
	payload jsonb NOT NULL,
	processed_at timestamp with time zone,
	created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.stripe_webhook_events
	ADD CONSTRAINT stripe_webhook_events_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX idx_stripe_webhook_events_event_id ON public.stripe_webhook_events USING btree (stripe_event_id);

-- migrate:down
ALTER TABLE users DROP COLUMN stripe_customer_id;

-- First drop subscriptions and their constraints so they don't depend on stripe_prices
DROP INDEX IF EXISTS idx_stripe_subscriptions_user_id;
DROP INDEX IF EXISTS idx_stripe_subscriptions_subscription_id;
ALTER TABLE IF EXISTS public.stripe_subscriptions DROP CONSTRAINT IF EXISTS stripe_subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS public.stripe_subscriptions DROP CONSTRAINT IF EXISTS stripe_subscriptions_price_id_fkey;
ALTER TABLE IF EXISTS public.stripe_subscriptions DROP CONSTRAINT IF EXISTS stripe_subscriptions_pkey;
DROP TABLE IF EXISTS public.stripe_subscriptions;

-- Drop webhook events table
DROP INDEX IF EXISTS idx_stripe_webhook_events_event_id;
ALTER TABLE IF EXISTS public.stripe_webhook_events DROP CONSTRAINT IF EXISTS stripe_webhook_events_pkey;
DROP TABLE IF EXISTS public.stripe_webhook_events;

-- Now drop stripe_prices and its indexes
DROP INDEX IF EXISTS idx_stripe_prices_product_id;
DROP INDEX IF EXISTS idx_stripe_prices_price_id;
ALTER TABLE IF EXISTS public.stripe_prices DROP CONSTRAINT IF EXISTS stripe_prices_pkey;
DROP TABLE IF EXISTS public.stripe_prices;

-- drop enum type
DO $$ BEGIN
	DROP TYPE IF EXISTS public.stripe_subscription_status;
EXCEPTION
	WHEN undefined_object THEN null;
END $$;

