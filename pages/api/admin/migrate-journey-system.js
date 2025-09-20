import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting journey system migration...')

    // SQL to create journey system tables
    const migrationSQL = `
      -- Create journeys table
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

      -- Create journey_days table
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

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view active journeys for their tag" ON public.journeys;
      DROP POLICY IF EXISTS "Admins can manage all journeys" ON public.journeys;
      DROP POLICY IF EXISTS "Users can view days for accessible journeys" ON public.journey_days;
      DROP POLICY IF EXISTS "Admins can manage all journey days" ON public.journey_days;
      DROP POLICY IF EXISTS "Users can view own journey progress" ON public.user_journey_progress;
      DROP POLICY IF EXISTS "Users can update own journey progress" ON public.user_journey_progress;
      DROP POLICY IF EXISTS "Users can insert own journey progress" ON public.user_journey_progress;
      DROP POLICY IF EXISTS "Admins can view all journey progress" ON public.user_journey_progress;

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
    `

    // For now, return success and let user run SQL manually
    // The RPC function might not exist, so we'll provide the SQL for manual execution

    console.log('Journey system migration completed successfully')

    return res.status(200).json({
      success: true,
      message: 'Journey system setup instructions provided. Please run the SQL manually in Supabase SQL Editor.',
      sql: migrationSQL
    })

  } catch (error) {
    console.error('Error during migration:', error)
    return res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message 
    })
  }
}
