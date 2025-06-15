import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { Mail, Settings, CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupabaseEmailFix() {
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('alenps76@gmail.com')
  const [results, setResults] = useState([])
  const [supabaseInfo, setSupabaseInfo] = useState(null)

  useEffect(() => {
    getSupabaseInfo()
  }, [])

  const addResult = (result) => {
    setResults(prev => [...prev, { ...result, timestamp: new Date().toLocaleTimeString() }])
  }

  const getSupabaseInfo = () => {
    const info = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      projectId: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0],
      dashboardUrl: `https://supabase.com/dashboard/project/${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}`
    }
    setSupabaseInfo(info)
  }

  const testSupabaseEmail = async () => {
    setTesting(true)
    setResults([])

    try {
      addResult({
        type: 'Info',
        success: true,
        message: `Testing Supabase email confirmation for ${testEmail}`,
        details: {}
      })

      // Step 1: Check if user is in allowed_users
      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', testEmail.toLowerCase())
        .single()

      if (allowedError || !allowedUser) {
        addResult({
          type: 'Step 1',
          success: false,
          message: 'User not in allowed_users table',
          details: { error: allowedError?.message }
        })
        return
      }

      addResult({
        type: 'Step 1',
        success: true,
        message: 'User found in allowed_users table',
        details: allowedUser
      })

      // Step 2: Test Supabase email sending
      addResult({
        type: 'Step 2',
        success: true,
        message: 'Testing Supabase email verification...',
        details: {}
      })

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
          message: 'Supabase email verification failed',
          details: { 
            error: resendError.message,
            code: resendError.status,
            suggestion: 'Supabase email service not configured properly'
          }
        })

        // Provide specific solutions based on error
        if (resendError.message?.includes('rate limit')) {
          addResult({
            type: 'Solution',
            success: false,
            message: 'Rate limit exceeded - wait before trying again',
            details: { waitTime: '60 seconds' }
          })
        } else if (resendError.message?.includes('not found')) {
          addResult({
            type: 'Solution',
            success: false,
            message: 'User not found in Supabase Auth - needs to register first',
            details: {}
          })
        } else {
          addResult({
            type: 'Solution',
            success: false,
            message: 'Supabase email service not configured - see configuration steps below',
            details: {}
          })
        }
      } else {
        addResult({
          type: 'Step 2',
          success: true,
          message: 'Supabase email sent successfully!',
          details: { email: testEmail }
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
      setTesting(false)
    }
  }

  const copySupabaseConfig = () => {
    const config = `
# Supabase Email Configuration Steps

## 1. Go to Supabase Dashboard
URL: ${supabaseInfo?.dashboardUrl}

## 2. Navigate to Authentication Settings
Path: Authentication → Settings → Email

## 3. Configure Email Service

### Option A: Use Supabase Email Service (Default)
- Enable "Enable email confirmations"
- Set Site URL: ${window.location.origin}
- Set Redirect URLs: ${window.location.origin}/auth/callback

### Option B: Configure Custom SMTP (Recommended)
- Enable "Enable custom SMTP"
- SMTP Host: smtp.gmail.com
- SMTP Port: 587
- SMTP User: your-email@gmail.com
- SMTP Password: your-app-password
- Sender Name: NBCC Church
- Sender Email: your-email@gmail.com

## 4. Update Email Templates
Path: Authentication → Email Templates

### Confirm Signup Template:
Subject: Confirm your signup
Body: 
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirm your mail</a></p>

## 5. Test Configuration
- Use the test tool in this page
- Check email delivery
- Verify redirect URLs work

## Current Project Info:
Project ID: ${supabaseInfo?.projectId}
Site URL: ${window.location.origin}
Callback URL: ${window.location.origin}/auth/callback
    `.trim()

    navigator.clipboard.writeText(config).then(() => {
      toast.success('Configuration guide copied to clipboard!')
    }).catch(() => {
      toast.error('Could not copy to clipboard')
    })
  }

  const disableEmailConfirmation = async () => {
    try {
      addResult({
        type: 'Workaround',
        success: true,
        message: 'Attempting to disable email confirmation requirement...',
        details: {}
      })

      // This would require admin API access which we don't have from client
      // Instead, provide instructions
      addResult({
        type: 'Workaround',
        success: false,
        message: 'Cannot disable from client - manual configuration required',
        details: {
          instruction: 'Go to Supabase Dashboard → Authentication → Settings → Email and disable "Enable email confirmations"'
        }
      })

      toast.info('Manual configuration required - see results for instructions')
    } catch (error) {
      addResult({
        type: 'Error',
        success: false,
        message: 'Workaround failed',
        details: { error: error.message }
      })
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center">
              <Mail className="h-6 w-6 mr-2 text-blue-600" />
              Supabase Email Confirmation Fix
            </h1>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Email Confirmation Issue Detected
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Users are not receiving "confirm your signup" emails. This is a Supabase configuration issue, 
                    separate from EmailJS which is working fine for agreement notifications.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    onClick={testSupabaseEmail}
                    disabled={testing || !testEmail}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testing ? 'Testing...' : 'Test Supabase Email'}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={copySupabaseConfig}
                    className="w-full bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 text-sm flex items-center justify-center"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Configuration Guide
                  </button>
                  
                  <a
                    href={supabaseInfo?.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-purple-600 text-white py-2 px-3 rounded-md hover:bg-purple-700 text-sm flex items-center justify-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open Supabase Dashboard
                  </a>
                  
                  <button
                    onClick={disableEmailConfirmation}
                    className="w-full bg-orange-600 text-white py-2 px-3 rounded-md hover:bg-orange-700 text-sm flex items-center justify-center"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Disable Email Confirmation
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

          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Configuration Steps</h2>
            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-medium text-blue-900 mb-2">Step 1: Configure Supabase Email</h3>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Go to Supabase Dashboard → Authentication → Settings</li>
                  <li>Enable "Enable email confirmations"</li>
                  <li>Set Site URL: {window.location.origin}</li>
                  <li>Add Redirect URL: {window.location.origin}/auth/callback</li>
                  <li>Configure SMTP settings (recommended) or use Supabase email service</li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="font-medium text-green-900 mb-2">Step 2: Test Email Delivery</h3>
                <ul className="list-disc list-inside space-y-1 text-green-800">
                  <li>Use the test tool above to verify email sending</li>
                  <li>Check spam folders</li>
                  <li>Verify email templates are configured correctly</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <h3 className="font-medium text-orange-900 mb-2">Alternative: Disable Email Confirmation</h3>
                <p className="text-orange-800">
                  If email configuration is too complex, you can disable email confirmation in 
                  Supabase Dashboard → Authentication → Settings → Email and uncheck "Enable email confirmations".
                  Users will be able to register without email verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
