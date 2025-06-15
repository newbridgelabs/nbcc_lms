import { useEffect } from 'react'
import emailjs from 'emailjs-com'

// Client-side email service component
export default function EmailService() {
  useEffect(() => {
    // Initialize EmailJS when component mounts
    const initEmailJS = () => {
      try {
        const userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID
        if (userId && userId !== 'your_user_id') {
          emailjs.init(userId)
          console.log('✅ EmailJS initialized successfully with User ID:', userId)
        } else {
          console.error('❌ EmailJS User ID not configured')
        }
      } catch (error) {
        console.error('❌ EmailJS initialization failed:', error)
      }
    }

    initEmailJS()
  }, [])

  return null // This component doesn't render anything
}

// Standalone email sending function for client-side use
export const sendEmailFromClient = async (templateParams) => {
  try {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID

    console.log('=== CLIENT-SIDE EMAIL SENDING ===')
    console.log('Service ID:', serviceId)
    console.log('Template ID:', templateId)
    console.log('User ID:', userId)
    console.log('Template params:', templateParams)

    if (!serviceId || !templateId || !userId) {
      throw new Error('EmailJS configuration missing')
    }

    if (serviceId === 'your_service_id' || templateId === 'your_template_id' || userId === 'your_user_id') {
      throw new Error('EmailJS configuration contains placeholder values')
    }

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('EmailJS can only be used in browser environment')
    }

    // Ensure EmailJS is initialized
    try {
      emailjs.init(userId)
      console.log('EmailJS re-initialized with User ID:', userId)
    } catch (initError) {
      console.error('EmailJS initialization error:', initError)
      throw new Error(`EmailJS initialization failed: ${initError.message}`)
    }

    // Send email with detailed error handling
    const result = await emailjs.send(serviceId, templateId, templateParams)

    console.log('✅ Email sent successfully:', result)
    return {
      success: true,
      result: result
    }
  } catch (error) {
    console.error('❌ Client email error:', error)

    // Provide more specific error messages
    let errorMessage = error.message
    if (error.message.includes('user ID is required')) {
      errorMessage = 'EmailJS User ID configuration issue. Please check your EmailJS dashboard integration settings.'
    } else if (error.message.includes('service')) {
      errorMessage = 'EmailJS Service configuration issue. Please verify your service is active.'
    } else if (error.message.includes('template')) {
      errorMessage = 'EmailJS Template configuration issue. Please verify your template exists and is published.'
    }

    return {
      success: false,
      error: errorMessage,
      originalError: error.message
    }
  }
}
