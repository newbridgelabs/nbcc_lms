-- Fix registration access issues
-- Run this SQL in your Supabase SQL Editor

-- Create function to check if user is allowed to register (bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_allowed_user(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT, full_name TEXT, is_used BOOLEAN, invited_by UUID, invitation_sent_at TIMESTAMPTZ, registered_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
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
    au.is_used,
    au.invited_by,
    au.invitation_sent_at,
    au.registered_at,
    au.created_at,
    au.updated_at
  FROM public.allowed_users au
  WHERE au.email = user_email
  AND au.is_used = false;
END;
$$;

-- Create function to mark allowed user as used (bypasses RLS)
CREATE OR REPLACE FUNCTION public.mark_allowed_user_used(user_email TEXT)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.allowed_users
  SET 
    is_used = true,
    registered_at = NOW()
  WHERE email = user_email;
END;
$$;

-- Grant execute permissions to anonymous users (for registration)
GRANT EXECUTE ON FUNCTION public.check_allowed_user(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_allowed_user_used(TEXT) TO anon;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.check_allowed_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_allowed_user_used(TEXT) TO authenticated;

-- Create function to check all allowed users (including used ones) for login error handling
CREATE OR REPLACE FUNCTION public.check_all_allowed_users(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT, full_name TEXT, is_used BOOLEAN, invited_by UUID, invitation_sent_at TIMESTAMPTZ, registered_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
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
    au.is_used,
    au.invited_by,
    au.invitation_sent_at,
    au.registered_at,
    au.created_at,
    au.updated_at
  FROM public.allowed_users au
  WHERE au.email = user_email;
END;
$$;

-- Grant execute permissions for the new function
GRANT EXECUTE ON FUNCTION public.check_all_allowed_users(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_all_allowed_users(TEXT) TO authenticated;

-- Create a policy to allow anonymous users to read allowed_users for registration check
-- This is a more secure alternative to the RPC functions above
DROP POLICY IF EXISTS "Allow registration check for allowed users" ON public.allowed_users;
CREATE POLICY "Allow registration check for allowed users" ON public.allowed_users
  FOR SELECT TO anon, authenticated
  USING (true);

-- Note: The above policy allows reading, but the RPC functions are more secure
-- You can choose to use either approach. The RPC functions are recommended.
