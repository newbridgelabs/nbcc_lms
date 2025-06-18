-- Fix registration and email confirmation issues
-- Run this in your Supabase SQL Editor

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS check_user_email_status(TEXT);
DROP FUNCTION IF EXISTS cleanup_unconfirmed_user(TEXT);
DROP FUNCTION IF EXISTS reset_allowed_user_status(TEXT);
DROP FUNCTION IF EXISTS check_allowed_user(TEXT);
DROP FUNCTION IF EXISTS handle_user_registration(TEXT, UUID);
DROP FUNCTION IF EXISTS mark_allowed_user_used(TEXT);
DROP FUNCTION IF EXISTS cleanup_failed_registration(TEXT);

-- 1. Create function to check if user exists but email not confirmed
CREATE OR REPLACE FUNCTION check_user_email_status(user_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at
  FROM auth.users au
  WHERE au.email = user_email;
END;
$$;

-- 2. Create function to safely delete unconfirmed users (for cleanup)
CREATE OR REPLACE FUNCTION cleanup_unconfirmed_user(user_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Check if user exists and is unconfirmed
  SELECT id, email_confirmed_at INTO user_record
  FROM auth.users
  WHERE email = user_email;
  
  -- If user exists but email not confirmed, allow cleanup
  IF user_record.id IS NOT NULL AND user_record.email_confirmed_at IS NULL THEN
    -- Delete from custom users table first (if exists)
    DELETE FROM public.users WHERE id = user_record.id;
    
    -- Note: We cannot directly delete from auth.users via SQL
    -- This would need to be done via Supabase Admin API
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 3. Update allowed_users policies to be more flexible
DROP POLICY IF EXISTS "Allow service role to manage allowed users" ON allowed_users;
CREATE POLICY "Allow service role to manage allowed users" ON allowed_users
  FOR ALL USING (true);

-- 4. Create function to reset allowed_user status (for re-registration)
CREATE OR REPLACE FUNCTION reset_allowed_user_status(user_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Check if user exists in auth.users
  SELECT id, email_confirmed_at INTO user_record
  FROM auth.users
  WHERE email = user_email;
  
  -- If user doesn't exist or email not confirmed, allow reset
  IF user_record.id IS NULL OR user_record.email_confirmed_at IS NULL THEN
    UPDATE allowed_users 
    SET is_used = FALSE, 
        used_at = NULL,
        updated_at = NOW()
    WHERE email = user_email;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 5. Update the check_allowed_user function to be more flexible
CREATE OR REPLACE FUNCTION check_allowed_user(user_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  is_used BOOLEAN,
  used_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  invitation_sent_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.full_name,
    COALESCE(au.is_used, FALSE) as is_used,
    au.used_at,
    au.registered_at,
    au.invitation_sent_at
  FROM allowed_users au
  WHERE au.email = user_email
  AND (au.is_used IS NULL OR au.is_used = FALSE);
END;
$$;

-- 6. Create function to handle registration with email resend
CREATE OR REPLACE FUNCTION handle_user_registration(
  user_email TEXT,
  user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  needs_resend BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  allowed_record RECORD;
  auth_user_record RECORD;
BEGIN
  -- Check if user is allowed
  SELECT * INTO allowed_record FROM allowed_users WHERE email = user_email;
  
  IF allowed_record.id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User not in allowed list', FALSE;
    RETURN;
  END IF;
  
  -- Check if user exists in auth.users
  SELECT id, email_confirmed_at INTO auth_user_record
  FROM auth.users WHERE email = user_email;
  
  -- If user exists but email not confirmed, allow resend
  IF auth_user_record.id IS NOT NULL AND auth_user_record.email_confirmed_at IS NULL THEN
    RETURN QUERY SELECT TRUE, 'User exists, resend confirmation', TRUE;
    RETURN;
  END IF;
  
  -- If user confirmed and allowed_user marked as used, they're already registered
  IF auth_user_record.email_confirmed_at IS NOT NULL AND allowed_record.is_used THEN
    RETURN QUERY SELECT FALSE, 'User already registered', FALSE;
    RETURN;
  END IF;
  
  -- If new registration with user_id provided, mark as used
  IF user_id IS NOT NULL THEN
    UPDATE allowed_users 
    SET is_used = TRUE, 
        used_at = NOW(),
        updated_at = NOW()
    WHERE email = user_email;
    
    RETURN QUERY SELECT TRUE, 'Registration successful', FALSE;
    RETURN;
  END IF;
  
  -- Default: allow registration
  RETURN QUERY SELECT TRUE, 'Registration allowed', FALSE;
END;
$$;

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_user_email_status(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_unconfirmed_user(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION reset_allowed_user_status(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION handle_user_registration(TEXT, UUID) TO anon, authenticated;

-- 8. Update existing functions to handle edge cases better
CREATE OR REPLACE FUNCTION mark_allowed_user_used(user_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE allowed_users 
  SET is_used = TRUE, 
      used_at = NOW(),
      updated_at = NOW()
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$;

-- 9. Create cleanup function for failed registrations
CREATE OR REPLACE FUNCTION cleanup_failed_registration(user_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  auth_user_record RECORD;
  time_threshold TIMESTAMPTZ;
BEGIN
  -- Only cleanup users created more than 1 hour ago without confirmation
  time_threshold := NOW() - INTERVAL '1 hour';
  
  SELECT id, email_confirmed_at, created_at INTO auth_user_record
  FROM auth.users 
  WHERE email = user_email 
    AND email_confirmed_at IS NULL 
    AND created_at < time_threshold;
  
  IF auth_user_record.id IS NOT NULL THEN
    -- Reset allowed_user status
    UPDATE allowed_users 
    SET is_used = FALSE, 
        used_at = NULL,
        updated_at = NOW()
    WHERE email = user_email;
    
    -- Delete from custom users table
    DELETE FROM public.users WHERE id = auth_user_record.id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_failed_registration(TEXT) TO service_role;

-- 10. Add helpful comments
COMMENT ON FUNCTION check_user_email_status IS 'Check if user exists in auth.users and their email confirmation status';
COMMENT ON FUNCTION reset_allowed_user_status IS 'Reset allowed_user status for re-registration attempts';
COMMENT ON FUNCTION handle_user_registration IS 'Handle user registration with proper checks and resend logic';
COMMENT ON FUNCTION cleanup_failed_registration IS 'Cleanup failed registrations older than 1 hour';

-- Success message
SELECT 'Registration and email confirmation fixes applied successfully!' as message;

-- Add missing columns to allowed_users table if they don't exist
DO $$ 
BEGIN 
    -- Add is_used column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'allowed_users' AND column_name = 'is_used') THEN
        ALTER TABLE allowed_users ADD COLUMN is_used boolean DEFAULT false;
    END IF;

    -- Add used_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'allowed_users' AND column_name = 'used_at') THEN
        ALTER TABLE allowed_users ADD COLUMN used_at timestamptz;
    END IF;

    -- Add registered_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'allowed_users' AND column_name = 'registered_at') THEN
        ALTER TABLE allowed_users ADD COLUMN registered_at timestamptz;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'allowed_users' AND column_name = 'updated_at') THEN
        ALTER TABLE allowed_users ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS check_allowed_user(user_email text);

-- Create or replace the check_allowed_user function
CREATE OR REPLACE FUNCTION check_allowed_user(user_email text)
RETURNS TABLE (
    id uuid,
    email text,
    full_name text,
    is_used boolean,
    used_at timestamptz,
    registered_at timestamptz,
    invitation_sent_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.full_name,
        COALESCE(au.is_used, false) as is_used,
        au.used_at,
        au.registered_at,
        au.invitation_sent_at
    FROM allowed_users au
    WHERE au.email = lower(user_email)
    AND (au.is_used IS NULL OR au.is_used = false);
END;
$$;

-- Create or replace the mark_allowed_user_used function
CREATE OR REPLACE FUNCTION mark_allowed_user_used(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE allowed_users
    SET 
        is_used = true,
        used_at = now(),
        registered_at = now(),
        updated_at = now()
    WHERE email = lower(user_email);
END;
$$;
