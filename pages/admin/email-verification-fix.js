import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { Mail, Send, CheckCircle, XCircle, AlertTriangle, RefreshCw, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailVerificationFix() {
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('alenps76@gmail.com')
  const [results, setResults] = useState([])
  const [supabaseConfig, setSupabaseConfig] = useState(null)

  useEffect(() => {
    checkSupabaseConfig()
  }, [])

  const addResult = (result) => {
    setResults(prev => [...prev, { ...result, timestamp: new Date().toLocaleTimeString() }])
  }

  const checkSupabaseConfig = async () => {
    try {
      // Check if Supabase is configured
      const config = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set',
        supabaseConnected: !!supabase
      }
      setSupabaseConfig(config)
    } catch (error) {
      console.error('Config check error:', error)
    }
  }

  const testEmailVerification = async () => {
    setLoading(true)
    setResults([])
    
    try {
      addResult({
        type: 'Info',
        success: true,
        message: `Starting email verification test for ${testEmail}`,
        details: { email: testEmail }
      })

      // Step 1: Check if user exists in allowed_users
      addResult({
        type: 'Step 1',
        success: true,
        message: 'Checking allowed_users table...',
        details: {}
      })

      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', testEmail.toLowerCase())
        .single()

      if (allowedError || !allowedUser) {
        addResult({
          type: 'Step 1',
          success: false,
          message: 'User not found in allowed_users table',
          details: { error: allowedError?.message }
        })
        
        // Add user to allowed_users if not found
        addResult({
          type: 'Fix',
          success: true,
          message: 'Adding user to allowed_users table...',
          details: {}
        })

        const { data: newUser, error: insertError } = await supabase
          .from('allowed_users')
          .insert({
            email: testEmail.toLowerCase(),
            full_name: 'Alen PS',
            invited_by: 'admin',
            invitation_sent_at: new Date().toISOString(),
            is_used: false
          })
          .select()
          .single()

        if (insertError) {
          addResult({
            type: 'Fix',
            success: false,
            message: 'Failed to add user to allowed_users',
            details: { error: insertError.message }
          })
        } else {
          addResult({
            type: 'Fix',
            success: true,
            message: 'User added to allowed_users successfully',
            details: newUser
          })
        }
      } else {
        addResult({
          type: 'Step 1',
          success: true,
          message: 'User found in allowed_users table',
          details: allowedUser
        })
      }

      // Step 2: Test email sending
      addResult({
        type: 'Step 2',
        success: true,
        message: 'Testing email verification sending...',
        details: {}
      })

      // Try to resend verification email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (resendError) {
        addResult({
          type: 'Step 2',
          success: false,
          message: 'Failed to send verification email via Supabase',
          details: { error: resendError.message }
        })

        // If Supabase email fails, suggest manual verification
        addResult({
          type: 'Alternative',
          success: true,
          message: 'Supabase email not configured. User can register without email verification.',
          details: { 
            suggestion: 'Configure Supabase SMTP settings or use manual verification',
            workaround: 'User can complete registration and admin can manually verify'
          }
        })
      } else {
        addResult({
          type: 'Step 2',
          success: true,
          message: 'Verification email sent successfully via Supabase',
          details: { email: testEmail }
        })
      }

      // Step 3: Check if user can register
      addResult({
        type: 'Step 3',
        success: true,
        message: 'Testing registration process...',
        details: {}
      })

      // Test the registration check function
      const { data: registrationCheck, error: regError } = await supabase.rpc('check_allowed_user', {
        user_email: testEmail.toLowerCase()
      })

      if (regError) {
        addResult({
          type: 'Step 3',
          success: false,
          message: 'Registration check failed',
          details: { error: regError.message }
        })
      } else if (registrationCheck && registrationCheck.length > 0) {
        addResult({
          type: 'Step 3',
          success: true,
          message: 'User can register successfully',
          details: registrationCheck[0]
        })
      } else {
        addResult({
          type: 'Step 3',
          success: false,
          message: 'User cannot register - not in allowed list',
          details: {}
        })
      }

    } catch (error) {
      addResult({
        type: 'Error',
        success: false,
        message: 'Test failed with error',
        details: { error: error.message }
      })
    } finally {
      setLoading(false)
    }
  }

  const manuallyVerifyUser = async () => {
    try {
      // Mark user as verified in allowed_users
      const { error } = await supabase
        .from('allowed_users')
        .update({ 
          is_used: false, // Keep as false so they can still register
          manual_verification: true,
          verified_at: new Date().toISOString()
        })
        .eq('email', testEmail.toLowerCase())

      if (error) {
        toast.error('Failed to manually verify user: ' + error.message)
      } else {
        toast.success('User manually verified! They can now register without email verification.')
        addResult({
          type: 'Manual Fix',
          success: true,
          message: 'User manually verified - can register without email confirmation',
          details: { email: testEmail }
        })
      }
    } catch (error) {
      toast.error('Manual verification failed: ' + error.message)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center">
              <Mail className="h-6 w-6 mr-2 text-blue-600" />
              Email Verification Fix Tool
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Supabase Configuration</h3>
                {supabaseConfig && (
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>URL:</span>
                      <span className={supabaseConfig.url ? 'text-green-600' : 'text-red-600'}>
                        {supabaseConfig.url ? 'Set' : 'Not Set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Anon Key:</span>
                      <span className={supabaseConfig.anonKey ? 'text-green-600' : 'text-red-600'}>
                        {supabaseConfig.anonKey ? 'Set' : 'Not Set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Connected:</span>
                      <span className={supabaseConfig.supabaseConnected ? 'text-green-600' : 'text-red-600'}>
                        {supabaseConfig.supabaseConnected ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email to test"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={testEmailVerification}
                    disabled={loading || !testEmail}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Testing...' : 'Test Email Verification'}
                  </button>
                  
                  <button
                    onClick={manuallyVerifyUser}
                    disabled={!testEmail}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Manual Verify
                  </button>
                </div>
              </div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Test Results</h2>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md border-l-4 ${
                      result.success
                        ? 'border-green-400 bg-green-50'
                        : 'border-red-400 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-gray-900">
                            [{result.type}] {result.message}
                          </span>
                          <span className="text-xs text-gray-500">
                            {result.timestamp}
                          </span>
                        </div>
                        {result.details && Object.keys(result.details).length > 0 && (
                          <pre className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
