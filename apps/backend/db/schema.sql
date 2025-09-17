SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: stripe_subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stripe_subscription_status AS ENUM (
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin',
    'super_admin'
);


--
-- Name: update_journal_entries_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_journal_entries_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	NEW.updated_at := now();
	RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255),
    content text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    used_at timestamp with time zone
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: stripe_prices; Type: TABLE; Schema: public; Owner: -
--

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
    "interval" text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stripe_subscriptions; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: stripe_webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stripe_event_id text NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text NOT NULL,
    provider_user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    display_name text,
    stripe_customer_id text,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: stripe_prices stripe_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_prices
    ADD CONSTRAINT stripe_prices_pkey PRIMARY KEY (id);


--
-- Name: stripe_subscriptions stripe_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_subscriptions
    ADD CONSTRAINT stripe_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: stripe_webhook_events stripe_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_webhook_events
    ADD CONSTRAINT stripe_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: user_providers user_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_providers
    ADD CONSTRAINT user_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_notes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);


--
-- Name: idx_password_reset_tokens_token_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_token_hash ON public.password_reset_tokens USING btree (token_hash);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_stripe_prices_price_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_stripe_prices_price_id ON public.stripe_prices USING btree (stripe_price_id);


--
-- Name: idx_stripe_prices_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_prices_product_id ON public.stripe_prices USING btree (stripe_product_id);


--
-- Name: idx_stripe_subscriptions_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_stripe_subscriptions_subscription_id ON public.stripe_subscriptions USING btree (stripe_subscription_id);


--
-- Name: idx_stripe_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_subscriptions_user_id ON public.stripe_subscriptions USING btree (user_id);


--
-- Name: idx_stripe_webhook_events_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_stripe_webhook_events_event_id ON public.stripe_webhook_events USING btree (stripe_event_id);


--
-- Name: idx_user_providers_provider_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_providers_provider_pair ON public.user_providers USING btree (provider, provider_user_id);


--
-- Name: idx_user_providers_user_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_providers_user_provider ON public.user_providers USING btree (user_id, provider);


--
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_active ON public.users USING btree (active);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: notes update_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notes notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: stripe_subscriptions stripe_subscriptions_price_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_subscriptions
    ADD CONSTRAINT stripe_subscriptions_price_id_fkey FOREIGN KEY (stripe_price_id) REFERENCES public.stripe_prices(stripe_price_id) ON DELETE RESTRICT;


--
-- Name: stripe_subscriptions stripe_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_subscriptions
    ADD CONSTRAINT stripe_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_providers user_providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_providers
    ADD CONSTRAINT user_providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250822062025'),
    ('20250824080000'),
    ('20250905000000'),
    ('20250908100338'),
    ('20250913060934'),
    ('20250916125647'),
    ('20250916130733');
