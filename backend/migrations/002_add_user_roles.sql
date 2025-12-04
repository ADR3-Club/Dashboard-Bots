-- Add role column to users table
-- Roles: admin, user
-- - admin: Full access (manage users, all process actions)
-- - user: Read-only access (view dashboard, logs, history)

ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- Update existing users to admin role
UPDATE users SET role = 'admin' WHERE role IS NULL OR role = 'user';
