import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { checkAdminAccess } from '../../lib/admin-config'
import { Database, CheckCircle, AlertCircle, Play } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FixRegistration() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [results, setResults] = useState(null)
  const router = useRouter()

  useEffect(() => {
    initializeAdmin()
  }, [])

  const initializeAdmin = async () => {
    const { isAdmin, user: currentUser } = await checkAdminAccess(router, setUser, setLoading)
    // If not admin, checkAdminAccess will redirect
  }

  const fixRegistrationSQL = `
-- Fix registration access issues
-- Run this SQL in your Supabase SQL Editor

-- Create function to check if user is allowed to register (bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_allowed_user(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT, full_name TEXT, is_used BOOLEAN, invited_by UUID, invitation_sent_at TIMESTAMPTZ, registered_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.full_name,
    au.is_used,
    au.invited_by,
    au.invitation_sent_at,
    au.registered_at,
    au.created_at,
    au.updated_at
  FROM public.allowed_users au
  WHERE au.email = user_email
  AND au.is_used = false;
END;
$$;

-- Create function to mark allowed user as used (bypasses RLS)
CREATE OR REPLACE FUNCTION public.mark_allowed_user_used(user_email TEXT)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.allowed_users
  SET 
    is_used = true,
    registered_at = NOW()
  WHERE email = user_email;
END;
$$;

-- Create function to check all allowed users (including used ones) for login error handling
CREATE OR REPLACE FUNCTION public.check_all_allowed_users(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT, full_name TEXT, is_used BOOLEAN, invited_by UUID, invitation_sent_at TIMESTAMPTZ, registered_at TIMESTAMPTZ, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.full_name,
    au.is_used,
    au.invited_by,
    au.invitation_sent_at,
    au.registered_at,
    au.created_at,
    au.updated_at
  FROM public.allowed_users au
  WHERE au.email = user_email;
END;
$$;

-- Grant execute permissions to anonymous users (for registration)
GRANT EXECUTE ON FUNCTION public.check_allowed_user(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_allowed_user_used(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_all_allowed_users(TEXT) TO anon;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.check_allowed_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_allowed_user_used(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_all_allowed_users(TEXT) TO authenticated;
`

  const executeSQL = async () => {
    setExecuting(true)
    setResults(null)

    try {
      // Execute the SQL using Supabase's rpc function
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: fixRegistrationSQL
      })

      if (error) {
        // If the rpc function doesn't exist, we'll need to run it manually
        console.error('SQL execution error:', error)
        setResults({
          success: false,
          message: 'SQL execution failed. Please run the SQL manually in Supabase SQL Editor.',
          error: error.message
        })
        toast.error('SQL execution failed. Please run manually in Supabase.')
      } else {
        setResults({
          success: true,
          message: 'Registration fix applied successfully!',
          data
        })
        toast.success('Registration fix applied successfully!')
      }
    } catch (error) {
      console.error('Error executing SQL:', error)
      setResults({
        success: false,
        message: 'Failed to execute SQL. Please copy the SQL and run it manually in Supabase SQL Editor.',
        error: error.message
      })
      toast.error('Failed to execute SQL')
    } finally {
      setExecuting(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fixRegistrationSQL)
    toast.success('SQL copied to clipboard!')
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fix Registration Issues</h1>
          <p className="mt-2 text-gray-600">
            This will create database functions to fix the registration access issues.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Registration Fix SQL
          </h2>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Important</h3>
                <p className="text-sm text-red-700 mt-1">
                  This SQL creates database functions to allow user registration. Run this once to fix the registration issues.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={executeSQL}
                disabled={executing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50"
              >
                {executing ? (
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {executing ? 'Executing...' : 'Execute SQL'}
              </button>

              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
              >
                <Database className="h-4 w-4 mr-2" />
                Copy SQL
              </button>
            </div>

            {results && (
              <div className={`p-4 rounded-md ${results.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex">
                  {results.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`text-sm font-medium ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                      {results.success ? 'Success' : 'Error'}
                    </h3>
                    <p className={`text-sm mt-1 ${results.success ? 'text-green-700' : 'text-red-700'}`}>
                      {results.message}
                    </p>
                    {results.error && (
                      <p className="text-sm text-red-600 mt-2 font-mono">
                        {results.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Manual Instructions</h3>
              <p className="text-sm text-gray-600 mb-2">
                If automatic execution fails, copy the SQL above and:
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>Paste the SQL and click "Run"</li>
                <li>Refresh this page to test registration</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">What this fixes:</h3>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Allows users to register even when not authenticated</li>
            <li>Creates secure database functions that bypass RLS for registration</li>
            <li>Improves error messages during login attempts</li>
            <li>Prevents admin session from showing during user registration</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
