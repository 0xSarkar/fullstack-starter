-- migrate:up
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN display_name text;

CREATE TABLE user_providers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_providers_provider_pair
  ON user_providers(provider, provider_user_id);

CREATE UNIQUE INDEX idx_user_providers_user_provider
  ON user_providers(user_id, provider);

-- migrate:down
-- WARNING: This will fail if any users have NULL password_hash.
-- To force rollback safely we set a dummy hash for NULLs (not a valid bcrypt hash).
UPDATE users SET password_hash = '$2a$12$DUMMYROLLBACKPASSWORDHASHxxxxxxxzzzzzzzzzzzzzzzzzzzzzz' WHERE password_hash IS NULL;

DROP TABLE user_providers;
ALTER TABLE users DROP COLUMN display_name;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;