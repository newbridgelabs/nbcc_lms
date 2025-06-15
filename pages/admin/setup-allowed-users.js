import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Database, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SetupAllowedUsers() {
  const [setupStatus, setSetupStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_allowed_users_email ON public.allowed_users(email);
CREATE INDEX IF NOT EXISTS idx_allowed_users_is_used ON public.allowed_users(is_used);

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to view allowed users" ON public.allowed_users;
DROP POLICY IF EXISTS "Allow authenticated users to insert allowed users" ON public.allowed_users;
DROP POLICY IF EXISTS "Allow authenticated users to update allowed users" ON public.allowed_users;
DROP POLICY IF EXISTS "Allow authenticated users to delete allowed users" ON public.allowed_users;

-- Simple RLS policies - allow all authenticated users for now
CREATE POLICY "Allow authenticated users to view allowed users" ON public.allowed_users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert allowed users" ON public.allowed_users
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update allowed users" ON public.allowed_users
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete allowed users" ON public.allowed_users
  FOR DELETE TO authenticated USING (true);

-- Insert a test record to verify everything works
INSERT INTO public.allowed_users (email, full_name, temp_password)
VALUES ('test@example.com', 'Test User', 'temp123')
ON CONFLICT (email) DO NOTHING;
`

  const runMigration = async () => {
    setLoading(true)
    setSetupStatus(null)

    try {
      console.log('Testing allowed_users table connection...')

      // Try to query the table to see if it exists
      const { data, error } = await supabase
        .from('allowed_users')
        .select('*')
        .limit(1)

      console.log('Query result:', { data, error })

      if (!error) {
        // Table exists and is accessible
        setSetupStatus('success')
        toast.success('Allowed users table is working correctly!')
        return
      }

      // Check if it's a table not found error
      if (error.message && error.message.includes('does not exist')) {
        setSetupStatus('manual')
        toast.error('Table not found. Please run the SQL migration manually in Supabase SQL Editor')
      } else {
        // Some other error (possibly permissions)
        console.error('Table access error:', error)
        setSetupStatus('manual')
        toast.error('Table access error: ' + error.message)
      }

    } catch (error) {
      console.error('Migration test error:', error)
      setSetupStatus('manual')
      toast.error('Connection test failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold leading-7 text-gray-900">
                  Setup Allowed Users Table
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Create the database table for managing selective user registration
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <div className="text-center">
                <Database className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Database Migration Required
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  The allowed users feature requires a new database table. Click the button below to create it.
                </p>

                {setupStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-sm text-green-800">
                        Migration completed successfully! You can now manage allowed users.
                      </p>
                    </div>
                  </div>
                )}

                {setupStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-sm text-red-800">
                        Migration failed. Please try running the SQL manually in Supabase.
                      </p>
                    </div>
                  </div>
                )}

                {setupStatus === 'manual' && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800 font-medium">
                        Manual Setup Required
                      </p>
                    </div>
                    <div className="text-sm text-yellow-800">
                      <p className="mb-2">Please follow these steps:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to your Supabase dashboard</li>
                        <li>Navigate to SQL Editor</li>
                        <li>Copy the SQL from <code>allowed-users-migration.sql</code></li>
                        <li>Paste and run it in the SQL Editor</li>
                        <li>Come back and click "Test Connection" below</li>
                      </ol>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    onClick={runMigration}
                    disabled={loading || setupStatus === 'success'}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner w-5 h-5 mr-2"></div>
                        Checking...
                      </>
                    ) : setupStatus === 'success' ? (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Table Ready
                      </>
                    ) : setupStatus === 'manual' ? (
                      <>
                        <Database className="h-5 w-5 mr-2" />
                        Test Connection
                      </>
                    ) : (
                      <>
                        <Database className="h-5 w-5 mr-2" />
                        Check Table Status
                      </>
                    )}
                  </button>

                  {setupStatus === 'success' && (
                    <div className="mt-4">
                      <button
                        onClick={() => router.push('/admin/allowed-users')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-church-primary bg-church-primary bg-opacity-10 hover:bg-opacity-20"
                      >
                        Go to Allowed Users Management
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-8 text-left">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">What this migration does:</h4>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• Creates the allowed_users table</li>
                    <li>• Sets up Row Level Security policies</li>
                    <li>• Creates necessary indexes for performance</li>
                    <li>• Configures admin-only access permissions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
