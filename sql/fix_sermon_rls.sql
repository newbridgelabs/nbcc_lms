-- Fix RLS policies for sermon system
-- Run this if you're having issues with saving responses

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own responses" ON sermon_responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON sermon_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON sermon_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON sermon_responses;

-- Recreate response policies with better error handling
CREATE POLICY "Users can view their own responses" ON sermon_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses" ON sermon_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses" ON sermon_responses
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to view all responses
CREATE POLICY "Admins can view all responses" ON sermon_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
        )
    );

-- Also ensure participation policies are correct
DROP POLICY IF EXISTS "Users can manage their own participation" ON sermon_participation;

CREATE POLICY "Users can view their own participation" ON sermon_participation
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own participation" ON sermon_participation
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON sermon_participation
    FOR UPDATE USING (auth.uid() = user_id);

-- Test the policies by checking if we can query the tables
SELECT 'RLS policies updated successfully!' as status;

-- Show current policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has conditions'
        ELSE 'No conditions'
    END as has_conditions
FROM pg_policies 
WHERE tablename IN ('sermon_responses', 'sermon_participation')
ORDER BY tablename, policyname;
