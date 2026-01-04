-- Migration to update users table from username to email
-- Run this before starting the auth service

-- Step 1: Add email column as nullable first
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Step 2: Add name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Step 3: Add password reset columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- Step 4: Migrate existing data (convert username to email format if needed)
-- For development: you can create placeholder emails from usernames
UPDATE users 
SET email = username || '@temp.local' 
WHERE email IS NULL AND username IS NOT NULL;

-- For development: set placeholder names from usernames
UPDATE users 
SET name = COALESCE(name, username)
WHERE name IS NULL;

-- Step 5: Now make email NOT NULL and add unique constraint
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Step 6: Drop the old username column (optional - comment out if you want to keep it)
-- ALTER TABLE users DROP COLUMN IF EXISTS username;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token);

-- Step 8: Drop old username index if exists
DROP INDEX IF EXISTS idx_users_username;
