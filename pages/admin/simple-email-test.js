import { useState } from 'react'
import Layout from '../../components/Layout'
import { Mail, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import emailjs from 'emailjs-com'

export default function SimpleEmailTest() {
  const [sending, setSending] = useState(false)
  const [testEmail, setTestEmail] = useState('newbridgelabs@gmail.com')

  const sendSimpleTest = async () => {
    setSending(true)
    
    try {
      // Use the exact same configuration as your working emails
      const serviceId = 'service_6p2szkk'
      const templateId = 'template_h0ekplo'
      const userId = 'vjXyYpLgDibpvaLPL'

      console.log('=== SIMPLE EMAIL TEST ===')
      console.log('Service ID:', serviceId)
      console.log('Template ID:', templateId)
      console.log('User ID:', userId)
      console.log('Test email:', testEmail)

      // Initialize EmailJS
      emailjs.init(userId)

      // Use the EXACT same parameters as shown in your EmailJS history
      const templateParams = {
        user_os: 'Linux 64',
        user_platform: 'Linux',
        user_browser: 'Chrome',
        user_version: '138.0.0',
        user_country: 'United Kingdom',
        user_ip: 'b014d1deed8734617346763f22d78f6',
        user_referrer: 'http://localhost:3000/',
        to_email: testEmail,
        to_name: 'Test User',
        subject: 'Simple Test Email from NBCC',
        message: `This is a simple test email to verify EmailJS is working.

If you receive this email, the configuration is correct.

Test timestamp: ${new Date().toISOString()}`,
        registration_url: 'http://localhost:3000/auth/register',
        website_url: 'http://localhost:3000'
      }

      console.log('Sending with params:', templateParams)

      const result = await emailjs.send(serviceId, templateId, templateParams)

      console.log('Email result:', result)

      if (result.status === 200) {
        toast.success('Test email sent successfully! Check your inbox (and spam folder).')
      } else {
        toast.error(`Email failed with status: ${result.status}`)
      }

    } catch (error) {
      console.error('Email test error:', error)
      toast.error(`Email test failed: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const sendMinimalTest = async () => {
    setSending(true)
    
    try {
      const serviceId = 'service_6p2szkk'
      const templateId = 'template_h0ekplo'
      const userId = 'vjXyYpLgDibpvaLPL'

      emailjs.init(userId)

      // Minimal parameters - just what's absolutely necessary
      const templateParams = {
        to_email: testEmail,
        to_name: 'Test User',
        subject: 'Minimal Test',
        message: 'This is a minimal test email.'
      }

      console.log('Sending minimal test with params:', templateParams)

      const result = await emailjs.send(serviceId, templateId, templateParams)

      console.log('Minimal email result:', result)

      if (result.status === 200) {
        toast.success('Minimal test email sent! Check your inbox.')
      } else {
        toast.error(`Minimal email failed with status: ${result.status}`)
      }

    } catch (error) {
      console.error('Minimal email test error:', error)
      toast.error(`Minimal email test failed: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Simple Email Test
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Test EmailJS with simple parameters to isolate the issue
              </p>
            </div>

            <div className="p-6">
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

              <div className="space-y-4">
                <button
                  onClick={sendSimpleTest}
                  disabled={sending || !testEmail}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sending ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Full Test Email
                    </>
                  )}
                </button>

                <button
                  onClick={sendMinimalTest}
                  disabled={sending || !testEmail}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sending ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Minimal Test Email
                    </>
                  )}
                </button>
              </div>

              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Troubleshooting Tips</h2>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 mb-2">If emails show "OK" but don't arrive:</h3>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Check spam/junk folder</li>
                      <li>Gmail might be blocking the emails</li>
                      <li>Template parameters might not match your template</li>
                      <li>EmailJS service might need re-verification</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Alternative Solutions:</h3>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Switch to Supabase Auth email (more reliable)</li>
                      <li>Use a different email service (SendGrid, Mailgun)</li>
                      <li>Configure SMTP directly</li>
                      <li>Use server-side email sending</li>
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
