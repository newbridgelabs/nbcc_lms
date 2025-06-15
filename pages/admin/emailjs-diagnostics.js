import { useState } from 'react'
import Layout from '../../components/Layout'
import { Mail, CheckCircle, XCircle, AlertTriangle, ExternalLink, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import emailjs from 'emailjs-com'

export default function EmailJSDiagnostics() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState(null)
  const [testEmail, setTestEmail] = useState('newbridgelabs@gmail.com')

  const runDiagnostics = async () => {
    setTesting(true)
    setResults(null)

    const diagnostics = {
      configCheck: false,
      serviceCheck: false,
      templateCheck: false,
      emailTest: false,
      errors: [],
      details: {},
      recommendations: []
    }

    try {
      console.log('=== EMAILJS DIAGNOSTICS ===')

      // 1. Check configuration
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
      const userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID

      diagnostics.details.config = {
        serviceId: serviceId,
        templateId: templateId,
        userId: userId ? userId.substring(0, 8) + '...' : 'Not set'
      }

      if (!serviceId || !templateId || !userId) {
        diagnostics.errors.push('Missing EmailJS configuration variables')
      } else if (serviceId === 'your_service_id' || templateId === 'your_template_id' || userId === 'your_user_id') {
        diagnostics.errors.push('EmailJS configuration contains placeholder values')
      } else {
        diagnostics.configCheck = true
      }

      // 2. Initialize EmailJS
      if (diagnostics.configCheck) {
        try {
          emailjs.init(userId)
          diagnostics.serviceCheck = true
          console.log('EmailJS initialized successfully')
        } catch (initError) {
          diagnostics.errors.push(`EmailJS initialization failed: ${initError.message}`)
        }
      }

      // 3. Test email sending
      if (diagnostics.serviceCheck && testEmail) {
        try {
          console.log('Testing email send to:', testEmail)
          
          const testParams = {
            to_email: testEmail,
            to_name: 'Test Recipient',
            subject: '🧪 EmailJS Diagnostic Test',
            message: `This is a diagnostic test email from NBCC Church Management System.

If you receive this email, EmailJS is working correctly.

Test Details:
• Timestamp: ${new Date().toISOString()}
• Service ID: ${serviceId}
• Template ID: ${templateId}
• Test Type: Diagnostic

This is an automated test message.`,
            user_os: navigator.platform || 'Unknown',
            user_platform: navigator.userAgent.includes('Windows') ? 'Windows' : 
                          navigator.userAgent.includes('Mac') ? 'Mac' : 
                          navigator.userAgent.includes('Linux') ? 'Linux' : 'Unknown',
            user_browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                         navigator.userAgent.includes('Firefox') ? 'Firefox' :
                         navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
            user_version: '1.0.0',
            user_country: 'Unknown',
            user_ip: 'Unknown',
            user_referrer: window.location.href,
            website_url: window.location.origin
          }

          console.log('Sending test email with params:', testParams)

          const result = await emailjs.send(serviceId, templateId, testParams)
          
          console.log('EmailJS send result:', result)
          
          if (result.status === 200) {
            diagnostics.emailTest = true
            diagnostics.details.emailResult = {
              status: result.status,
              text: result.text
            }
          } else {
            diagnostics.errors.push(`Email send failed with status: ${result.status}`)
            diagnostics.details.emailResult = result
          }

        } catch (emailError) {
          console.error('Email test error:', emailError)
          diagnostics.errors.push(`Email test failed: ${emailError.message}`)
          diagnostics.details.emailError = emailError.message
        }
      }

      // 4. Generate recommendations
      if (!diagnostics.configCheck) {
        diagnostics.recommendations.push('Check your .env.local file for correct EmailJS configuration')
      }
      
      if (!diagnostics.serviceCheck) {
        diagnostics.recommendations.push('Verify your EmailJS User ID in the dashboard')
      }
      
      if (!diagnostics.emailTest && diagnostics.serviceCheck) {
        diagnostics.recommendations.push('Check your EmailJS service configuration (Gmail settings)')
        diagnostics.recommendations.push('Verify your template exists and is published')
        diagnostics.recommendations.push('Check spam folder for test emails')
      }

      if (diagnostics.emailTest) {
        diagnostics.recommendations.push('EmailJS is working! Check spam folder if emails are not received')
        diagnostics.recommendations.push('Consider switching to a more reliable email service for production')
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
                <Mail className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  EmailJS Diagnostics
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Diagnose EmailJS configuration and email delivery issues
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

              {/* Test Button */}
              <div className="mb-6">
                <button
                  onClick={runDiagnostics}
                  disabled={testing || !testEmail}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {testing ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Running Diagnostics...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Run EmailJS Diagnostics
                    </>
                  )}
                </button>
              </div>

              {/* Results */}
              {results && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Diagnostic Results</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Configuration Check</span>
                      {getStatusIcon(results.configCheck)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Service Initialization</span>
                      {getStatusIcon(results.serviceCheck)}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Email Send Test</span>
                      {getStatusIcon(results.emailTest)}
                    </div>
                  </div>

                  {/* Configuration Details */}
                  {results.details.config && (
                    <div className="mt-4">
                      <h3 className="text-md font-medium text-gray-900 mb-2">Configuration:</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(results.details.config, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Errors */}
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

                  {/* Recommendations */}
                  {results.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-md font-medium text-blue-900 mb-2">Recommendations:</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                          {results.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EmailJS Setup Guide */}
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">EmailJS Setup Guide</h2>
                
                <div className="space-y-4 text-sm">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 mb-2">Common Issues:</h3>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Gmail service might be blocking emails</li>
                      <li>Template parameters don't match your template</li>
                      <li>Using User ID instead of Public Key</li>
                      <li>Service not properly configured in EmailJS dashboard</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Setup Steps:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Go to <a href="https://dashboard.emailjs.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">EmailJS Dashboard <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                      <li>Create/verify your email service (Gmail, Outlook, etc.)</li>
                      <li>Create/update your email template</li>
                      <li>Get your Service ID, Template ID, and Public Key</li>
                      <li>Update your .env.local file with correct values</li>
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
