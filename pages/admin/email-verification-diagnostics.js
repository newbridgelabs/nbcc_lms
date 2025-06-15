import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { Mail, CheckCircle, XCircle, AlertTriangle, ExternalLink, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailVerificationDiagnostics() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState(null)
  const [testEmail, setTestEmail] = useState('alenpr76@gmail.com')

  const runDiagnostics = async () => {
    setTesting(true)
    setResults(null)

    const diagnostics = {
      supabaseConfig: false,
      emailSettings: false,
      testRegistration: false,
      errors: [],
      details: {}
    }

    try {
      console.log('=== EMAIL VERIFICATION DIAGNOSTICS ===')

      // Check Supabase configuration
      if (!supabase) {
        diagnostics.errors.push('Supabase client not configured')
      } else {
        diagnostics.supabaseConfig = true
        diagnostics.details.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      }

      // Check email settings in Supabase
      if (diagnostics.supabaseConfig) {
        try {
          // Try to get current user to test connection
          const { data: { user }, error } = await supabase.auth.getUser()
          if (!error) {
            diagnostics.emailSettings = true
            diagnostics.details.currentUser = user?.email || 'No user logged in'
          } else {
            diagnostics.errors.push(`Auth connection error: ${error.message}`)
          }
        } catch (authError) {
          diagnostics.errors.push(`Auth test failed: ${authError.message}`)
        }
      }

      // Test registration process (simulation)
      if (diagnostics.supabaseConfig && testEmail) {
        try {
          console.log('Testing registration process for:', testEmail)

          // First, get ALL allowed users to see what's in the table
          const { data: allAllowedUsers, error: allError } = await supabase
            .from('allowed_users')
            .select('*')

          console.log('All allowed users:', allAllowedUsers)
          diagnostics.details.allAllowedUsers = allAllowedUsers

          // Check if email is in allowed_users (exact match)
          const { data: allowedUser, error: allowedError } = await supabase
            .from('allowed_users')
            .select('*')
            .eq('email', testEmail.toLowerCase())
            .eq('is_used', false)
            .single()

          console.log('Allowed user query result:', { allowedUser, allowedError })
          diagnostics.details.allowedUserQuery = { allowedUser, allowedError }

          // Also try without is_used filter
          const { data: allowedUserAny, error: allowedErrorAny } = await supabase
            .from('allowed_users')
            .select('*')
            .eq('email', testEmail.toLowerCase())
            .single()

          console.log('Allowed user (any status) query result:', { allowedUserAny, allowedErrorAny })
          diagnostics.details.allowedUserAnyQuery = { allowedUserAny, allowedErrorAny }

          if (allowedError || !allowedUser) {
            diagnostics.errors.push(`Email ${testEmail} is not in allowed_users list or already used`)
            diagnostics.details.allowedUserStatus = 'Not found or already used'

            // Check if it exists but is already used
            if (allowedUserAny) {
              diagnostics.details.allowedUserStatus = 'Found but already used'
              diagnostics.details.allowedUserData = allowedUserAny
            }
          } else {
            diagnostics.testRegistration = true
            diagnostics.details.allowedUserStatus = 'Found and available'
            diagnostics.details.allowedUserData = allowedUser
          }
        } catch (regError) {
          diagnostics.errors.push(`Registration test failed: ${regError.message}`)
        }
      }

      setResults(diagnostics)

    } catch (error) {
      console.error('Diagnostics error:', error)
      diagnostics.errors.push(`Diagnostics error: ${error.message}`)
      setResults(diagnostics)
    } finally {
      setTesting(false)
    }
  }

  const testEmailVerification = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address')
      return
    }

    setTesting(true)
    try {
      console.log('Testing email verification for:', testEmail)

      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      // Try to resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      toast.success('Test verification email sent! Check the inbox.')
    } catch (error) {
      console.error('Test email error:', error)
      toast.error(`Test failed: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (status) => {
    if (status === true) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (status === false) return <XCircle className="h-5 w-5 text-red-500" />
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <User className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Email Verification Diagnostics
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Troubleshoot user registration and email verification issues
              </p>
            </div>

            <div className="p-6">
              {/* Test Email Input */}
              <div className="mb-6">
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

              {/* Test Buttons */}
              <div className="mb-6 flex space-x-4">
                <button
                  onClick={runDiagnostics}
                  disabled={testing}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {testing ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Run Diagnostics
                    </>
                  )}
                </button>

                <button
                  onClick={testEmailVerification}
                  disabled={testing || !testEmail}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Test Email Send
                </button>
              </div>

              {/* Results */}
              {results && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900">Diagnostic Results</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Supabase Configuration</span>
                      {getStatusIcon(results.supabaseConfig)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Email Settings</span>
                      {getStatusIcon(results.emailSettings)}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Registration Test</span>
                      {getStatusIcon(results.testRegistration)}
                    </div>
                  </div>

                  {/* Details */}
                  {Object.keys(results.details).length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-md font-medium text-gray-900 mb-2">Details:</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(results.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {results.errors.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-md font-medium text-red-900 mb-2">Issues Found:</h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                          {results.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Troubleshooting Guide */}
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Common Email Issues</h2>
                
                <div className="space-y-4 text-sm">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 mb-2">Email Not Received:</h3>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Check spam/junk folder</li>
                      <li>Verify Supabase email settings in dashboard</li>
                      <li>Ensure email service is properly configured</li>
                      <li>Check if email domain is blocked</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Supabase Email Setup:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">Supabase Dashboard <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                      <li>Navigate to Authentication → Settings</li>
                      <li>Configure SMTP settings or use Supabase's email service</li>
                      <li>Test email delivery</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
