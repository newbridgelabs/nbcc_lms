import { useState } from 'react'
import Layout from '../../components/Layout'
import { sendEmailFromClient } from '../../components/EmailService'
import { Mail, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailDiagnostics() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState(null)

  const runDiagnostics = async () => {
    setTesting(true)
    setResults(null)

    const diagnostics = {
      configCheck: false,
      initCheck: false,
      sendCheck: false,
      errors: []
    }

    try {
      // Check environment variables
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
      const userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID

      console.log('=== EMAIL DIAGNOSTICS ===')
      console.log('Service ID:', serviceId)
      console.log('Template ID:', templateId)
      console.log('User ID:', userId)

      if (!serviceId || !templateId || !userId) {
        diagnostics.errors.push('Missing environment variables')
      } else if (serviceId === 'your_service_id' || templateId === 'your_template_id' || userId === 'your_user_id') {
        diagnostics.errors.push('Environment variables contain placeholder values')
      } else {
        diagnostics.configCheck = true
      }

      // Test email sending
      if (diagnostics.configCheck) {
        const testParams = {
          to_email: 'newbridgelabs@gmail.com',
          to_name: 'Test Recipient',
          subject: '🧪 NBCC Email Diagnostics Test',
          message: `This is a diagnostic test email from the NBCC Church Management System.

Test Details:
• Timestamp: ${new Date().toISOString()}
• Service ID: ${serviceId}
• Template ID: ${templateId}
• User ID: ${userId}

If you receive this email, the email service is working correctly.

This is an automated test message.`,
          pdf_url: 'https://example.com/test.pdf',
          agreement_id: 'DIAGNOSTIC-TEST'
        }

        const emailResult = await sendEmailFromClient(testParams)
        
        if (emailResult.success) {
          diagnostics.sendCheck = true
        } else {
          diagnostics.errors.push(`Email sending failed: ${emailResult.error}`)
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
                  Email Service Diagnostics
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Test and troubleshoot the email notification system
              </p>
            </div>

            <div className="p-6">
              {/* Configuration Info */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Current Configuration</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Service ID:</span>
                      <br />
                      <code className="text-blue-600">{process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'Not set'}</code>
                    </div>
                    <div>
                      <span className="font-medium">Template ID:</span>
                      <br />
                      <code className="text-blue-600">{process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'Not set'}</code>
                    </div>
                    <div>
                      <span className="font-medium">User ID:</span>
                      <br />
                      <code className="text-blue-600">{process.env.NEXT_PUBLIC_EMAILJS_USER_ID || 'Not set'}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Button */}
              <div className="mb-6">
                <button
                  onClick={runDiagnostics}
                  disabled={testing}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {testing ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Running Diagnostics...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Run Email Diagnostics
                    </>
                  )}
                </button>
              </div>

              {/* Results */}
              {results && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900">Diagnostic Results</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Configuration Check</span>
                      {getStatusIcon(results.configCheck)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Email Send Test</span>
                      {getStatusIcon(results.sendCheck)}
                    </div>
                  </div>

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

                  {results.sendCheck && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-700 font-medium">✅ Email service is working correctly!</p>
                      <p className="text-green-600 text-sm mt-1">
                        Test email sent to newbridgelabs@gmail.com
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Troubleshooting Guide */}
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Troubleshooting Guide</h2>
                
                <div className="space-y-4 text-sm">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 mb-2">Common Issues:</h3>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>EmailJS User ID not configured in dashboard integration settings</li>
                      <li>EmailJS service not active or properly connected</li>
                      <li>Email template not published or missing required variables</li>
                      <li>EmailJS account quota exceeded</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Setup Steps:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Visit <a href="https://dashboard.emailjs.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">EmailJS Dashboard <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                      <li>Go to Integration tab and ensure User ID is properly configured</li>
                      <li>Verify your email service is connected and active</li>
                      <li>Check that your email template includes all required variables</li>
                      <li>Ensure your template is published (not in draft mode)</li>
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
