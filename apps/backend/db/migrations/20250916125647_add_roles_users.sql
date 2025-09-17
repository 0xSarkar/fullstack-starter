-- migrate:up

-- Create user_role enum type
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- Add role column to users table with default value of 'user'
ALTER TABLE users 
ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- Create index on role column for efficient queries
CREATE INDEX idx_users_role ON users(role);

-- migrate:down

-- Remove the index first
DROP INDEX IF EXISTS idx_users_role;

-- Remove the role column
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Drop the enum type
DROP TYPE IF EXISTS user_role;

