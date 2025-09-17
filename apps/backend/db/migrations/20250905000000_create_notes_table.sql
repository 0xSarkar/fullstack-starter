-- Create notes table

-- migrate:up

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title varchar(255),
    content text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- migrate:down

DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;

DROP INDEX IF EXISTS idx_notes_user_id;

ALTER TABLE ONLY public.notes DROP CONSTRAINT notes_user_id_fkey;

ALTER TABLE ONLY public.notes DROP CONSTRAINT notes_pkey;

DROP TABLE public.notes;
