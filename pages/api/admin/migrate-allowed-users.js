import { supabase } from '../../../lib/supabase'
import { checkAdminAccessAPI } from '../../../lib/admin-config'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check admin access
    const adminCheck = await checkAdminAccessAPI(req)
    if (!adminCheck.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    console.log('Starting allowed_users table migration...')

    // SQL to create the allowed_users table and related policies
    const migrationSQL = `
      -- Create allowed_users table for selective registration
      CREATE TABLE IF NOT EXISTS public.allowed_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        invited_by UUID REFERENCES public.users(id),
        is_used BOOLEAN DEFAULT FALSE,
        temp_password TEXT,
        invitation_sent_at TIMESTAMP WITH TIME ZONE,
        registered_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable Row Level Security
      ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_allowed_users_email ON public.allowed_users(email);
      CREATE INDEX IF NOT EXISTS idx_allowed_users_is_used ON public.allowed_users(is_used);

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Admins can view all allowed users" ON public.allowed_users;
      DROP POLICY IF EXISTS "Admins can insert allowed users" ON public.allowed_users;
      DROP POLICY IF EXISTS "Admins can update allowed users" ON public.allowed_users;
      DROP POLICY IF EXISTS "Admins can delete allowed users" ON public.allowed_users;

      -- Create RLS policies for allowed_users table
      CREATE POLICY "Admins can view all allowed users" ON public.allowed_users
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.role = 'admin')
          )
        );

      CREATE POLICY "Admins can insert allowed users" ON public.allowed_users
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.role = 'admin')
          )
        );

      CREATE POLICY "Admins can update allowed users" ON public.allowed_users
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.role = 'admin')
          )
        );

      CREATE POLICY "Admins can delete allowed users" ON public.allowed_users
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.is_admin = true OR users.role = 'admin')
          )
        );
    `

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('Migration error:', error)
      return res.status(500).json({ 
        error: 'Migration failed', 
        details: error.message 
      })
    }

    console.log('Migration completed successfully')

    return res.status(200).json({
      success: true,
      message: 'Allowed users table created successfully'
    })

  } catch (error) {
    console.error('Error during migration:', error)
    return res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message 
    })
  }
}
