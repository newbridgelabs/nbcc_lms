-- Journey System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create journeys table
CREATE TABLE IF NOT EXISTS public.journeys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_tag TEXT NOT NULL, -- newcomer, existing_member, worship_team, admin
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journey_days table (for multi-day journeys like 5-day Bible study)
CREATE TABLE IF NOT EXISTS public.journey_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    scripture_reference VARCHAR(255),
    reflection_questions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(journey_id, day_number)
);

-- Create user_journey_progress table
CREATE TABLE IF NOT EXISTS public.user_journey_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE,
    day_id UUID REFERENCES public.journey_days(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    reflection_answers JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, day_id)
);

-- Enable Row Level Security
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_progress ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journeys_user_tag ON public.journeys(user_tag);
CREATE INDEX IF NOT EXISTS idx_journeys_is_active ON public.journeys(is_active);
CREATE INDEX IF NOT EXISTS idx_journey_days_journey_id ON public.journey_days(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_days_day_number ON public.journey_days(day_number);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user_id ON public.user_journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_journey_id ON public.user_journey_progress(journey_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_completed ON public.user_journey_progress(completed);

-- RLS Policies for journeys table
CREATE POLICY "Users can view active journeys for their tag" ON public.journeys
  FOR SELECT USING (
    is_active = true AND 
    user_tag = (SELECT user_tag FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage all journeys" ON public.journeys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- RLS Policies for journey_days table
CREATE POLICY "Users can view days for accessible journeys" ON public.journey_days
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.journeys
      WHERE journeys.id = journey_days.journey_id
      AND journeys.is_active = true
      AND journeys.user_tag = (SELECT user_tag FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all journey days" ON public.journey_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- RLS Policies for user_journey_progress table
CREATE POLICY "Users can view own journey progress" ON public.user_journey_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own journey progress" ON public.user_journey_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey progress" ON public.user_journey_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all journey progress" ON public.user_journey_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- Insert default 5-day newcomer journey
INSERT INTO public.journeys (title, description, user_tag, is_active) VALUES
('5-Day Bible Study for Newcomers', 'A foundational 5-day journey through key Bible passages for new church members', 'newcomer', true)
ON CONFLICT DO NOTHING;

-- Get the journey ID for inserting days
DO $$
DECLARE
    journey_uuid UUID;
BEGIN
    SELECT id INTO journey_uuid FROM public.journeys WHERE user_tag = 'newcomer' AND title = '5-Day Bible Study for Newcomers' LIMIT 1;
    
    IF journey_uuid IS NOT NULL THEN
        -- Insert the 5 days
        INSERT INTO public.journey_days (journey_id, day_number, title, content, scripture_reference, reflection_questions) VALUES
        (journey_uuid, 1, 'Day 1: God''s Love', 'Welcome to your journey of faith! Today we explore the foundational truth of God''s love for you.', 'John 3:16', '["What does it mean to you that God loves you?", "How have you experienced God''s love in your life?"]'),
        (journey_uuid, 2, 'Day 2: Salvation', 'Discover the gift of salvation and what it means for your life.', 'Romans 10:9-10', '["What does salvation mean to you personally?", "How has accepting Jesus changed your perspective?"]'),
        (journey_uuid, 3, 'Day 3: New Life in Christ', 'Learn about the transformation that comes with following Jesus.', '2 Corinthians 5:17', '["What changes have you noticed since beginning your faith journey?", "What old things are you ready to leave behind?"]'),
        (journey_uuid, 4, 'Day 4: Community and Fellowship', 'Understand the importance of Christian community and fellowship.', 'Hebrews 10:24-25', '["Why is fellowship with other believers important?", "How can you contribute to your church community?"]'),
        (journey_uuid, 5, 'Day 5: Living Your Faith', 'Discover how to live out your faith in daily life.', 'James 2:17', '["How will you live differently as a follower of Christ?", "What practical steps will you take to grow in your faith?"]')
        ON CONFLICT (journey_id, day_number) DO NOTHING;
    END IF;
END $$;
