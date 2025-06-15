import { sendAgreementEmails } from '../../../utils/emailService'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { testEmail } = req.body

    console.log('Testing email service...')
    console.log('Test email recipient:', testEmail)

    // Send test email using client-side EmailJS
    try {
      await sendAgreementEmails(
        testEmail,
        'Test User',
        'https://example.com/test.pdf',
        'TEST-001'
      )

      const result = {
        success: true,
        message: 'Test email sent successfully via client-side EmailJS',
        recipient: testEmail
      }

    if (result.success) {
      console.log('Test email sent successfully')
      return res.status(200).json({
        success: true,
        message: result.message || 'Test email sent successfully',
        recipient: result.recipient || testEmail,
        status: result.status
      })
    } else {
      console.error('All test email methods failed:', result.error)
      return res.status(500).json({
        success: false,
        error: result.error || 'All email methods failed'
      })
    }

  } catch (error) {
    console.error('Error in test email endpoint:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
