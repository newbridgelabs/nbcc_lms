-- Complete Sermon System Setup for Supabase
-- Run this SQL in your Supabase SQL Editor

-- First, ensure users table has the required admin columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Update existing admin users based on email
UPDATE public.users
SET is_admin = true, role = 'admin'
WHERE email IN ('admin@nbcc.com', 'pastor@nbcc.com', 'mppaul1458@gmail.com')
   OR email ILIKE '%admin%'
   OR email ILIKE '%pastor%';

-- First, drop existing tables if they exist (to ensure clean setup)
DROP TABLE IF EXISTS sermon_participation CASCADE;
DROP TABLE IF EXISTS sermon_public_questions CASCADE;
DROP TABLE IF EXISTS sermon_responses CASCADE;
DROP TABLE IF EXISTS sermon_questions CASCADE;
DROP TABLE IF EXISTS sermons CASCADE;

-- Create sermons table
CREATE TABLE sermons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sermon_date DATE NOT NULL,
    pastor_name VARCHAR(255),
    scripture_reference VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sermon_questions table
CREATE TABLE sermon_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    is_private BOOLEAN DEFAULT true,
    placeholder_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sermon_responses table
CREATE TABLE sermon_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
    question_id UUID REFERENCES sermon_questions(id) ON DELETE CASCADE,
    response_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Create sermon_public_questions table
CREATE TABLE sermon_public_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    is_answered BOOLEAN DEFAULT false,
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sermon_participation table
CREATE TABLE sermon_participation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    current_question_index INTEGER DEFAULT 0,
    UNIQUE(user_id, sermon_id)
);

-- Create indexes for better performance
CREATE INDEX idx_sermons_active ON sermons(is_active, sermon_date);
CREATE INDEX idx_sermon_questions_sermon_order ON sermon_questions(sermon_id, question_order);
CREATE INDEX idx_sermon_responses_user_sermon ON sermon_responses(user_id, sermon_id);
CREATE INDEX idx_sermon_public_questions_sermon ON sermon_public_questions(sermon_id, created_at);
CREATE INDEX idx_sermon_participation_user ON sermon_participation(user_id, sermon_id);

-- Enable Row Level Security on all tables
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_public_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_participation ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Sermons policies
CREATE POLICY "Anyone can view active sermons" ON sermons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sermons" ON sermons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
        )
    );

-- Sermon questions policies
CREATE POLICY "Anyone can view sermon questions" ON sermon_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sermons 
            WHERE id = sermon_questions.sermon_id AND is_active = true
        )
    );

CREATE POLICY "Admins can manage sermon questions" ON sermon_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
        )
    );

-- Sermon responses policies (private notes)
CREATE POLICY "Users can view their own responses" ON sermon_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses" ON sermon_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses" ON sermon_responses
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to view all responses for management purposes
CREATE POLICY "Admins can view all responses" ON sermon_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
        )
    );

-- Public questions policies
CREATE POLICY "Users can view their own questions" ON sermon_public_questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert public questions" ON sermon_public_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all public questions (anonymously)" ON sermon_public_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
        )
    );

CREATE POLICY "Admins can update public questions" ON sermon_public_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
        )
    );

-- Participation policies
CREATE POLICY "Users can view their own participation" ON sermon_participation
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own participation" ON sermon_participation
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON sermon_participation
    FOR UPDATE USING (auth.uid() = user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_sermons_updated_at BEFORE UPDATE ON sermons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sermon_questions_updated_at BEFORE UPDATE ON sermon_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sermon_responses_updated_at BEFORE UPDATE ON sermon_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sermon_public_questions_updated_at BEFORE UPDATE ON sermon_public_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample sermon for testing
INSERT INTO sermons (title, description, sermon_date, pastor_name, scripture_reference) 
VALUES (
    'Sample Interactive Sermon',
    'This is a sample sermon to test the Q&A system',
    CURRENT_DATE,
    'Pastor John',
    'John 3:16'
);

-- Get the sermon ID for sample questions
DO $$
DECLARE
    sermon_uuid UUID;
BEGIN
    SELECT id INTO sermon_uuid FROM sermons WHERE title = 'Sample Interactive Sermon' LIMIT 1;
    
    -- Insert sample questions
    INSERT INTO sermon_questions (sermon_id, question_text, question_order, is_private, placeholder_text) VALUES
    (sermon_uuid, 'What does this passage mean to you personally?', 1, true, 'Share your personal reflection...'),
    (sermon_uuid, 'How can you apply this teaching in your daily life?', 2, true, 'Think about practical applications...'),
    (sermon_uuid, 'What questions do you have about this topic?', 3, true, 'Write any questions or thoughts...'),
    (sermon_uuid, 'How has God been working in your life recently?', 4, true, 'Reflect on God''s presence...'),
    (sermon_uuid, 'What is one thing you want to remember from today?', 5, true, 'Write your key takeaway...'),
    (sermon_uuid, 'Do you have any questions for the pastor?', 6, false, 'Ask any questions you''d like answered publicly...');
END $$;

-- Verify the setup
SELECT 'Setup completed successfully!' as status;
SELECT 'Sermons created: ' || COUNT(*) as sermon_count FROM sermons;
SELECT 'Questions created: ' || COUNT(*) as question_count FROM sermon_questions;
