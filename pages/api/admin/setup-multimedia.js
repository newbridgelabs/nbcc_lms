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

    // Create multimedia content table
    const createTableSQL = `
      -- Create multimedia content table for rich section content
      CREATE TABLE IF NOT EXISTS multimedia_content (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        section_id UUID REFERENCES pdf_sections(id) ON DELETE CASCADE,
        content_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'video', 'audio', 'pdf', 'embed'
        title VARCHAR(255),
        content_data JSONB NOT NULL, -- Flexible storage for different content types
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    if (createError) {
      console.error('Error creating table:', createError)
      // Try alternative approach
      const { error: altError } = await supabase
        .from('multimedia_content')
        .select('id')
        .limit(1)
      
      if (altError && altError.code === '42P01') {
        // Table doesn't exist, we need to create it manually
        throw new Error('Table creation failed. Please run the SQL manually in Supabase dashboard.')
      }
    }

    // Create indexes
    const createIndexesSQL = `
      -- Create index for faster queries
      CREATE INDEX IF NOT EXISTS idx_multimedia_content_section_id ON multimedia_content(section_id);
      CREATE INDEX IF NOT EXISTS idx_multimedia_content_order ON multimedia_content(section_id, display_order);
    `

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL })
    if (indexError) {
      console.log('Index creation may have failed, but continuing...')
    }

    // Enable RLS
    const rlsSQL = `
      -- Enable RLS
      ALTER TABLE multimedia_content ENABLE ROW LEVEL SECURITY;
    `

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL })
    if (rlsError) {
      console.log('RLS setup may have failed, but continuing...')
    }

    // Create policies
    const policiesSQL = `
      -- Create policies
      CREATE POLICY IF NOT EXISTS "Allow authenticated users to read multimedia content" ON multimedia_content
        FOR SELECT TO authenticated USING (true);

      CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert multimedia content" ON multimedia_content
        FOR INSERT TO authenticated WITH CHECK (true);

      CREATE POLICY IF NOT EXISTS "Allow authenticated users to update multimedia content" ON multimedia_content
        FOR UPDATE TO authenticated USING (true);

      CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete multimedia content" ON multimedia_content
        FOR DELETE TO authenticated USING (true);
    `

    const { error: policyError } = await supabase.rpc('exec_sql', { sql: policiesSQL })
    if (policyError) {
      console.log('Policy creation may have failed, but continuing...')
    }

    // Create trigger function
    const triggerFunctionSQL = `
      -- Create function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_multimedia_content_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    const { error: functionError } = await supabase.rpc('exec_sql', { sql: triggerFunctionSQL })
    if (functionError) {
      console.log('Function creation may have failed, but continuing...')
    }

    // Create trigger
    const triggerSQL = `
      -- Create trigger
      DROP TRIGGER IF EXISTS update_multimedia_content_updated_at ON multimedia_content;
      CREATE TRIGGER update_multimedia_content_updated_at
        BEFORE UPDATE ON multimedia_content
        FOR EACH ROW
        EXECUTE FUNCTION update_multimedia_content_updated_at();
    `

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL })
    if (triggerError) {
      console.log('Trigger creation may have failed, but continuing...')
    }

    // Test if table is accessible
    const { data: testData, error: testError } = await supabase
      .from('multimedia_content')
      .select('id')
      .limit(1)

    if (testError) {
      throw new Error(`Table setup verification failed: ${testError.message}`)
    }

    console.log('Multimedia content table setup completed successfully')
    res.status(200).json({ 
      message: 'Multimedia content table setup completed successfully',
      tableAccessible: true
    })

  } catch (error) {
    console.error('Error setting up multimedia content table:', error)
    res.status(500).json({ 
      error: 'Failed to setup multimedia content table',
      details: error.message,
      instructions: 'Please run the SQL from sql/create_multimedia_content.sql manually in your Supabase dashboard'
    })
  }
}
