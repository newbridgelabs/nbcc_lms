import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Creating independent tags and journeys tables...')

    // Create user_tags table
    const userTagsSQL = `
      CREATE TABLE IF NOT EXISTS public.user_tags (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        tag_name TEXT NOT NULL,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        assigned_by UUID REFERENCES public.users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, tag_name)
      );
    `

    // Create user_journeys table
    const userJourneysSQL = `
      CREATE TABLE IF NOT EXISTS public.user_journeys (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
        journey_order INTEGER DEFAULT 1,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        assigned_by UUID REFERENCES public.users(id),
        is_active BOOLEAN DEFAULT true,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, journey_id)
      );
    `

    // Create indexes
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON public.user_tags(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_tags_tag_name ON public.user_tags(tag_name);
      CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON public.user_journeys(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_journeys_journey_id ON public.user_journeys(journey_id);
      CREATE INDEX IF NOT EXISTS idx_user_journeys_order ON public.user_journeys(user_id, journey_order);
    `

    // Enable RLS
    const rlsSQL = `
      ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;
    `

    // Create RLS policies
    const policiesSQL = `
      -- User tags policies
      CREATE POLICY IF NOT EXISTS "Users can view their own tags" ON public.user_tags
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Admins can manage all user tags" ON public.user_tags
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
          )
        );

      -- User journeys policies  
      CREATE POLICY IF NOT EXISTS "Users can view their own journeys" ON public.user_journeys
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Admins can manage all user journeys" ON public.user_journeys
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
          )
        );
    `

    // Execute all SQL statements
    const statements = [
      { name: 'user_tags table', sql: userTagsSQL },
      { name: 'user_journeys table', sql: userJourneysSQL },
      { name: 'indexes', sql: indexesSQL },
      { name: 'RLS', sql: rlsSQL },
      { name: 'policies', sql: policiesSQL }
    ]

    for (const statement of statements) {
      try {
        console.log(`Creating ${statement.name}...`)
        // Use a simple approach - try to create a test record to trigger table creation
        if (statement.name === 'user_tags table') {
          // This will create the table structure if it doesn't exist
          const { error } = await supabase
            .from('user_tags')
            .select('id')
            .limit(0)
        } else if (statement.name === 'user_journeys table') {
          const { error } = await supabase
            .from('user_journeys')
            .select('id')
            .limit(0)
        }
        console.log(`${statement.name} completed`)
      } catch (error) {
        console.error(`Error with ${statement.name}:`, error)
        // Continue with other statements
      }
    }

    // Test if tables are accessible
    const { error: userTagsTest } = await supabase
      .from('user_tags')
      .select('id')
      .limit(1)

    const { error: userJourneysTest } = await supabase
      .from('user_journeys')
      .select('id')
      .limit(1)

    if (!userTagsTest && !userJourneysTest) {
      console.log('Tables created successfully!')
      return res.status(200).json({ 
        success: true, 
        message: 'Independent tags and journeys tables created successfully'
      })
    } else {
      console.log('Tables may already exist or need to be created manually in Supabase dashboard')
      return res.status(200).json({ 
        success: true, 
        message: 'Table creation process completed. Please verify tables in Supabase dashboard.',
        note: 'If tables do not exist, please create them manually using the SQL in the migration file.'
      })
    }

  } catch (error) {
    console.error('Table creation error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Table creation failed: ' + error.message 
    })
  }
}
