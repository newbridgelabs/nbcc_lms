-- NBCC Journey System Setup SQL
-- Run this in your Supabase SQL Editor to set up the complete system

-- Step 1: Add user_tag columns to existing tables
ALTER TABLE public.allowed_users 
ADD COLUMN IF NOT EXISTS user_tag TEXT DEFAULT 'newcomer';

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_tag TEXT DEFAULT 'newcomer';

-- Update existing records
UPDATE public.allowed_users 
SET user_tag = 'newcomer' 
WHERE user_tag IS NULL;

UPDATE public.users 
SET user_tag = 'newcomer' 
WHERE user_tag IS NULL;

-- Step 2: Create journey system tables
CREATE TABLE IF NOT EXISTS public.journeys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_tag TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Step 3: Enable Row Level Security
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_progress ENABLE ROW LEVEL SECURITY;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_allowed_users_user_tag ON public.allowed_users(user_tag);
CREATE INDEX IF NOT EXISTS idx_users_user_tag ON public.users(user_tag);
CREATE INDEX IF NOT EXISTS idx_journeys_user_tag ON public.journeys(user_tag);
CREATE INDEX IF NOT EXISTS idx_journeys_is_active ON public.journeys(is_active);
CREATE INDEX IF NOT EXISTS idx_journey_days_journey_id ON public.journey_days(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_days_day_number ON public.journey_days(day_number);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user_id ON public.user_journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_journey_id ON public.user_journey_progress(journey_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_completed ON public.user_journey_progress(completed);

-- Step 5: RLS Policies for journeys table
DROP POLICY IF EXISTS "Users can view active journeys for their tag" ON public.journeys;
DROP POLICY IF EXISTS "Admins can manage all journeys" ON public.journeys;

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

-- Step 6: RLS Policies for journey_days table
DROP POLICY IF EXISTS "Users can view days for accessible journeys" ON public.journey_days;
DROP POLICY IF EXISTS "Admins can manage all journey days" ON public.journey_days;

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

-- Step 7: RLS Policies for user_journey_progress table
DROP POLICY IF EXISTS "Users can view own journey progress" ON public.user_journey_progress;
DROP POLICY IF EXISTS "Users can update own journey progress" ON public.user_journey_progress;
DROP POLICY IF EXISTS "Users can insert own journey progress" ON public.user_journey_progress;
DROP POLICY IF EXISTS "Admins can view all journey progress" ON public.user_journey_progress;

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

-- Step 8: Insert default 5-day newcomer journey
INSERT INTO public.journeys (title, description, user_tag, is_active) VALUES
('5-Day Bible Study for Newcomers', 'A foundational 5-day journey through key Bible passages for new church members', 'newcomer', true)
ON CONFLICT DO NOTHING;

-- Step 9: Insert default 14-day membership journey
INSERT INTO public.journeys (title, description, user_tag, is_active) VALUES
('14-Day Membership Booklet', 'A comprehensive 14-day study covering church membership, doctrine, and spiritual growth. Follows the 5-day Bible study for newcomers.', 'newcomer', true)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Journey system setup completed successfully!' as message;
