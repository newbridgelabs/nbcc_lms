import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Mail, Send, CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendHybridEmail, testEmailServices, sendSupabaseInvitationEmail, sendVerificationEmail } from '../../lib/supabase-email'

export default function EmailServiceTest() {
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('newbridgelabs@gmail.com')
  const [serviceStatus, setServiceStatus] = useState(null)
  const [results, setResults] = useState([])

  useEffect(() => {
    checkServices()
  }, [])

  const checkServices = async () => {
    const status = await testEmailServices(testEmail)
    setServiceStatus(status)
  }

  const addResult = (result) => {
    setResults(prev => [{ ...result, timestamp: new Date().toISOString() }, ...prev])
  }

  const testSupabaseInvitation = async () => {
    setTesting(true)
    try {
      const result = await sendSupabaseInvitationEmail(testEmail, 'Test User')
      addResult({
        type: 'Supabase Invitation',
        success: result.success,
        message: result.message || result.error,
        details: result
      })
      
      if (result.success) {
        toast.success('Supabase invitation email sent!')
      } else {
        toast.error('Supabase invitation failed: ' + result.error)
      }
    } catch (error) {
      addResult({
        type: 'Supabase Invitation',
        success: false,
        message: error.message,
        details: { error: error.message }
      })
      toast.error('Supabase invitation error: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  const testSupabaseVerification = async () => {
    setTesting(true)
    try {
      const result = await sendVerificationEmail(testEmail)
      addResult({
        type: 'Supabase Verification',
        success: result.success,
        message: result.message || result.error,
        details: result
      })
      
      if (result.success) {
        toast.success('Supabase verification email sent!')
      } else {
        toast.error('Supabase verification failed: ' + result.error)
      }
    } catch (error) {
      addResult({
        type: 'Supabase Verification',
        success: false,
        message: error.message,
        details: { error: error.message }
      })
      toast.error('Supabase verification error: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  const testHybridEmail = async () => {
    setTesting(true)
    try {
      const templateParams = {
        to_email: testEmail,
        to_name: 'Test User',
        subject: 'Hybrid Email Test',
        message: 'This is a test email from the hybrid email service.',
        user_os: 'Linux 64',
        user_platform: 'Linux',
        user_browser: 'Chrome',
        user_version: '138.0.0',
        user_country: 'United Kingdom',
        user_referrer: window.location.href,
        website_url: window.location.origin
      }

      const result = await sendHybridEmail(templateParams, 'notification')
      addResult({
        type: 'Hybrid Email',
        success: result.success,
        message: result.message || result.error,
        details: result
      })
      
      if (result.success) {
        toast.success('Hybrid email sent!')
      } else {
        toast.error('Hybrid email failed: ' + result.error)
      }
    } catch (error) {
      addResult({
        type: 'Hybrid Email',
        success: false,
        message: error.message,
        details: { error: error.message }
      })
      toast.error('Hybrid email error: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (status) => {
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status === false) return <XCircle className="h-4 w-4 text-red-500" />
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Email Service Testing
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Test different email services to find the most reliable option
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

              {/* Service Status */}
              {serviceStatus && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Service Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Supabase Email</span>
                      {getStatusIcon(serviceStatus.supabase.available)}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">EmailJS</span>
                      {getStatusIcon(serviceStatus.emailjs.available)}
                    </div>
                  </div>
                  {(serviceStatus.supabase.error || serviceStatus.emailjs.error) && (
                    <div className="mt-2 text-sm text-red-600">
                      {serviceStatus.supabase.error && <p>Supabase: {serviceStatus.supabase.error}</p>}
                      {serviceStatus.emailjs.error && <p>EmailJS: {serviceStatus.emailjs.error}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Test Buttons */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Email Tests</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={testSupabaseInvitation}
                    disabled={testing || !testEmail}
                    className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {testing ? (
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Supabase Invitation
                  </button>

                  <button
                    onClick={testSupabaseVerification}
                    disabled={testing || !testEmail}
                    className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {testing ? (
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Supabase Verification
                  </button>

                  <button
                    onClick={testHybridEmail}
                    disabled={testing || !testEmail}
                    className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {testing ? (
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Hybrid Email
                  </button>
                </div>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Test Results</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {results.map((result, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{result.type}</span>
                          <div className="flex items-center">
                            {getStatusIcon(result.success)}
                            <span className="ml-2 text-xs text-gray-500">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm ${
                          result.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.message}
                        </p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                            <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-4 text-sm">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">For Production Use:</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Use Supabase Auth emails for user registration/verification (most reliable)</li>
                      <li>Configure SMTP in Supabase for custom email templates</li>
                      <li>Use EmailJS only for non-critical notifications</li>
                      <li>Consider professional email services (SendGrid, Mailgun) for high volume</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">EmailJS Issues:</h4>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Free tier has limitations and reliability issues</li>
                      <li>Gmail service often blocks automated emails</li>
                      <li>Template parameters must match exactly</li>
                      <li>Better for contact forms than transactional emails</li>
                    </ul>
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
