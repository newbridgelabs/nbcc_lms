import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Creating journey_tags table...')

    // Create journey_tags table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.journey_tags (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
        tag_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(journey_id, tag_name)
      );
    `

    const { error: tableError } = await supabase.rpc('exec_sql', { 
      sql_query: createTableQuery 
    })

    if (tableError) {
      console.error('Table creation error:', tableError)
    } else {
      console.log('journey_tags table completed')
    }

    // Create indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_journey_tags_journey_id ON public.journey_tags(journey_id);',
      'CREATE INDEX IF NOT EXISTS idx_journey_tags_tag_name ON public.journey_tags(tag_name);',
      'CREATE INDEX IF NOT EXISTS idx_journey_tags_active ON public.journey_tags(is_active);'
    ]

    for (const query of indexQueries) {
      const { error: indexError } = await supabase.rpc('exec_sql', { 
        sql_query: query 
      })
      if (indexError) {
        console.error('Index creation error:', indexError)
      }
    }
    console.log('indexes completed')

    // Enable RLS
    const rlsQuery = 'ALTER TABLE public.journey_tags ENABLE ROW LEVEL SECURITY;'
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql_query: rlsQuery 
    })

    if (rlsError) {
      console.error('RLS error:', rlsError)
    } else {
      console.log('RLS completed')
    }

    // Create policies
    const policies = [
      `CREATE POLICY "journey_tags_select_policy" ON public.journey_tags FOR SELECT USING (true);`,
      `CREATE POLICY "journey_tags_insert_policy" ON public.journey_tags FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY "journey_tags_update_policy" ON public.journey_tags FOR UPDATE USING (true);`,
      `CREATE POLICY "journey_tags_delete_policy" ON public.journey_tags FOR DELETE USING (true);`
    ]

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { 
        sql_query: policy 
      })
      if (policyError && !policyError.message?.includes('already exists')) {
        console.error('Policy creation error:', policyError)
      }
    }
    console.log('policies completed')

    res.status(200).json({ 
      success: true, 
      message: 'Journey tags table creation process completed. Please verify tables in Supabase dashboard.',
      note: 'If tables already exist, this is normal and expected.'
    })

  } catch (error) {
    console.error('Error in journey tags table creation:', error)
    res.status(500).json({ 
      error: 'Failed to create journey tags table', 
      details: error.message 
    })
  }
}
