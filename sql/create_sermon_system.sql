-- Sermon Notes and Q&A System Database Schema

-- Table for sermons
CREATE TABLE IF NOT EXISTS sermons (
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

-- Table for sermon questions/outline points
CREATE TABLE IF NOT EXISTS sermon_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    is_private BOOLEAN DEFAULT true, -- true = private notes, false = visible to admin
    placeholder_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for user responses to sermon questions (private notes)
CREATE TABLE IF NOT EXISTS sermon_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
    question_id UUID REFERENCES sermon_questions(id) ON DELETE CASCADE,
    response_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Table for public Q&A submissions (anonymous to admin)
CREATE TABLE IF NOT EXISTS sermon_public_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- for user reference but not shown to admin
    is_answered BOOLEAN DEFAULT false,
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for sermon attendance/participation tracking
CREATE TABLE IF NOT EXISTS sermon_participation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    current_question_index INTEGER DEFAULT 0,
    UNIQUE(user_id, sermon_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sermons_active ON sermons(is_active, sermon_date);
CREATE INDEX IF NOT EXISTS idx_sermon_questions_sermon_order ON sermon_questions(sermon_id, question_order);
CREATE INDEX IF NOT EXISTS idx_sermon_responses_user_sermon ON sermon_responses(user_id, sermon_id);
CREATE INDEX IF NOT EXISTS idx_sermon_public_questions_sermon ON sermon_public_questions(sermon_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sermon_participation_user ON sermon_participation(user_id, sermon_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_public_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_participation ENABLE ROW LEVEL SECURITY;

-- Sermons policies
CREATE POLICY "Anyone can view active sermons" ON sermons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sermons" ON sermons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
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
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Sermon responses policies (private notes)
CREATE POLICY "Users can view their own responses" ON sermon_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses" ON sermon_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses" ON sermon_responses
    FOR UPDATE USING (auth.uid() = user_id);

-- Public questions policies
CREATE POLICY "Anyone can insert public questions" ON sermon_public_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own questions" ON sermon_public_questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all public questions (anonymously)" ON sermon_public_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can update public questions" ON sermon_public_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Participation policies
CREATE POLICY "Users can manage their own participation" ON sermon_participation
    FOR ALL USING (auth.uid() = user_id);

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
