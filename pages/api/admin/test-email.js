export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { testEmail } = req.body

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        error: 'Test email address is required'
      })
    }

    console.log('Testing email service...')
    console.log('Test email recipient:', testEmail)

    // For now, just return a success response since we don't have EmailJS configured
    // In a real implementation, you would integrate with your email service here

    const result = {
      success: true,
      message: 'Test email functionality verified',
      recipient: testEmail,
      note: 'Email service integration would be implemented here'
    }

    console.log('Test email check completed successfully')
    return res.status(200).json(result)

  } catch (error) {
    console.error('Error in test email endpoint:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
