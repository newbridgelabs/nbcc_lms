import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Setting up multimedia content table...')

    // Create the table using raw SQL
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create multimedia_content table
        CREATE TABLE IF NOT EXISTS public.multimedia_content (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          section_id UUID NOT NULL,
          content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'audio', 'pdf', 'embed')),
          title TEXT,
          content_data JSONB NOT NULL DEFAULT '{}',
          display_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_multimedia_content_section_id ON public.multimedia_content(section_id);
        CREATE INDEX IF NOT EXISTS idx_multimedia_content_display_order ON public.multimedia_content(section_id, display_order);
        CREATE INDEX IF NOT EXISTS idx_multimedia_content_active ON public.multimedia_content(is_active);

        -- Enable RLS (Row Level Security)
        ALTER TABLE public.multimedia_content ENABLE ROW LEVEL SECURITY;
      `
    })

    if (createError) {
      console.error('Error creating table:', createError)
      
      // Try alternative approach - direct table creation
      const { error: directError } = await supabase
        .from('multimedia_content')
        .select('id')
        .limit(1)

      if (directError && directError.code === '42P01') {
        // Table doesn't exist, let's try to create it manually
        return res.status(500).json({ 
          error: 'Table creation failed. Please create the table manually in Supabase dashboard.',
          sql: `
CREATE TABLE IF NOT EXISTS public.multimedia_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'audio', 'pdf', 'embed')),
  title TEXT,
  content_data JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_multimedia_content_section_id ON public.multimedia_content(section_id);
CREATE INDEX IF NOT EXISTS idx_multimedia_content_display_order ON public.multimedia_content(section_id, display_order);

-- Enable RLS
ALTER TABLE public.multimedia_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read multimedia content" ON public.multimedia_content
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert multimedia content" ON public.multimedia_content
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update multimedia content" ON public.multimedia_content
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete multimedia content" ON public.multimedia_content
  FOR DELETE TO authenticated USING (true);
          `
        })
      }
    }

    // Test if table exists now
    const { data: testData, error: testError } = await supabase
      .from('multimedia_content')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('Table test failed:', testError)
      return res.status(500).json({ 
        error: 'Table creation verification failed',
        details: testError
      })
    }

    console.log('✅ Multimedia content table setup completed successfully')
    res.status(200).json({ 
      message: 'Multimedia content table setup completed successfully',
      tableExists: true
    })

  } catch (error) {
    console.error('Error setting up multimedia content table:', error)
    res.status(500).json({ 
      error: 'Failed to setup multimedia content table',
      details: error.message
    })
  }
}
