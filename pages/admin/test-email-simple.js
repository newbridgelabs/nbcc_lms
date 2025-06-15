import { useState } from 'react'
import Layout from '../../components/Layout'
import { sendAgreementEmails } from '../../utils/emailService'
import toast from 'react-hot-toast'

export default function TestEmailSimple() {
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('madagalapadma2002@gmail.com')

  const testEmailSending = async () => {
    setTesting(true)
    try {
      console.log('=== EMAIL CONFIGURATION CHECK ===')
      console.log('Service ID:', process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID)
      console.log('Template ID:', process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID)
      console.log('User ID:', process.env.NEXT_PUBLIC_EMAILJS_USER_ID)
      console.log('Testing email with:', testEmail)

      await sendAgreementEmails(
        testEmail,
        'Test User',
        'https://example.com/test.pdf',
        'TEST-001'
      )

      toast.success('Test emails sent successfully!')
      console.log('✅ Test emails sent successfully')
    } catch (error) {
      console.error('❌ Test email failed:', error)
      toast.error('Test email failed: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6">Test Email Functionality</h1>
            
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
              
              <button
                onClick={testEmailSending}
                disabled={testing || !testEmail}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? 'Sending Test Emails...' : 'Send Test Emails'}
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">What this test does:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sends a test user email to the specified address</li>
                <li>• Sends a test admin email to newbridgelabs@gmail.com</li>
                <li>• Uses the same EmailJS configuration as the agreement approval</li>
                <li>• Check browser console for detailed logs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
