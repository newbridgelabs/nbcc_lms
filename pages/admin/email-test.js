import { useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { Mail, Send, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailTest() {
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState(null)

  const testEmailDelivery = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address')
      return
    }

    setTesting(true)
    setResults(null)

    try {
      console.log('Testing email delivery for:', testEmail)

      // Test 1: Check Supabase configuration
      const config = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        currentUrl: window.location.origin
      }

      // Test 2: Try to send a test signup email
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TempPassword123!',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      const testResults = {
        config,
        signupAttempt: {
          success: !error,
          error: error?.message,
          data: data ? {
            userCreated: !!data.user,
            userId: data.user?.id,
            emailConfirmed: !!data.user?.email_confirmed_at,
            needsConfirmation: !data.user?.email_confirmed_at
          } : null
        },
        timestamp: new Date().toISOString()
      }

      setResults(testResults)

      if (error) {
        if (error.message.includes('already registered')) {
          toast.success('Email system is working! (User already exists)')
        } else {
          toast.error(`Email test failed: ${error.message}`)
        }
      } else {
        toast.success('Test email sent! Check your inbox.')
      }

    } catch (error) {
      console.error('Email test error:', error)
      toast.error('Email test failed: ' + error.message)
      setResults({
        error: error.message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setTesting(false)
    }
  }

  const cleanupTestUser = async () => {
    if (!testEmail) return

    try {
      // Note: This would require admin privileges to actually delete the user
      // For now, just show instructions
      toast.success('Test user cleanup instructions logged to console')
      console.log(`To cleanup test user ${testEmail}:`)
      console.log('1. Go to Supabase Dashboard → Authentication → Users')
      console.log('2. Find and delete the test user')
      console.log('3. Or wait 24 hours for auto-cleanup')
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Email Delivery Test
                </h1>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Test if confirmation emails are being sent properly
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Test Form */}
                <div>
                  <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700">
                    Test Email Address
                  </label>
                  <div className="mt-1 flex space-x-3">
                    <input
                      type="email"
                      id="testEmail"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email to test..."
                    />
                    <button
                      onClick={testEmailDelivery}
                      disabled={testing || !testEmail}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {testing ? (
                        <>
                          <div className="loading-spinner w-4 h-4 mr-2"></div>
                          Testing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Test Email
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    This will attempt to send a signup confirmation email to test the email system
                  </p>
                </div>

                {/* Current Configuration */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Current Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Supabase URL:</span>
                      <br />
                      <span className="text-gray-600 break-all">
                        {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Current Site:</span>
                      <br />
                      <span className="text-gray-600 break-all">
                        {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                {results && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Test Results</h3>
                    
                    {results.error ? (
                      <div className="flex items-start space-x-2 text-red-600">
                        <XCircle className="h-5 w-5 mt-0.5" />
                        <div>
                          <p className="font-medium">Test Failed</p>
                          <p className="text-sm">{results.error}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                          {results.signupAttempt.success ? (
                            <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 mt-0.5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">
                              Signup Attempt: {results.signupAttempt.success ? 'Success' : 'Failed'}
                            </p>
                            {results.signupAttempt.error && (
                              <p className="text-sm text-red-600">{results.signupAttempt.error}</p>
                            )}
                            {results.signupAttempt.data && (
                              <div className="text-sm text-gray-600 mt-1">
                                <p>User Created: {results.signupAttempt.data.userCreated ? 'Yes' : 'No'}</p>
                                <p>Email Confirmed: {results.signupAttempt.data.emailConfirmed ? 'Yes' : 'No'}</p>
                                <p>Needs Confirmation: {results.signupAttempt.data.needsConfirmation ? 'Yes' : 'No'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <button
                        onClick={cleanupTestUser}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cleanup Test User
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        If emails are not being sent:
                      </h3>
                      <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                        <li>1. Check Supabase Dashboard → Authentication → Settings</li>
                        <li>2. Ensure "Enable email confirmations" is ON</li>
                        <li>3. Configure SMTP settings or use Supabase email service</li>
                        <li>4. Verify Site URL and Redirect URLs are correct</li>
                        <li>5. Check your email spam folder</li>
                      </ul>
                    </div>
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
