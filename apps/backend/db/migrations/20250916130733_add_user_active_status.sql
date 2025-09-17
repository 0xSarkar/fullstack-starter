-- migrate:up

-- Add active status column to users table with default value of true
ALTER TABLE users 
ADD COLUMN active boolean NOT NULL DEFAULT true;

-- Create index on active column for efficient queries
CREATE INDEX idx_users_active ON users(active);

-- migrate:down

-- Remove the index first
DROP INDEX IF EXISTS idx_users_active;

-- Remove the active column
ALTER TABLE users DROP COLUMN IF EXISTS active;

