import { supabase } from './supabase'
import { sendEmailWithRateLimit, getEmailSendingStatus } from './email-rate-limiter'
import { sendEmailWithMonitoring } from './email-monitoring'

/**
 * Supabase Email Service with Rate Limiting
 * More reliable alternative to EmailJS using Supabase's built-in email functionality
 * Now includes intelligent rate limiting to avoid Supabase email limits
 */

// Send invitation email using EmailJS
export const sendEmailJSInvitation = async (email, fullName) => {
  return await sendEmailWithMonitoring(async () => {
    console.log('Sending invitation email to:', email)

    // Check rate limiting status
    const status = getEmailSendingStatus()
    console.log('📊 Email rate limit status:', status)

    // Use rate-limited email sending with EmailJS
    const result = await sendEmailWithRateLimit(async () => {
      // Import EmailJS dynamically to avoid SSR issues
      const emailjs = (await import('emailjs-com')).default
      
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_6p2szkk'
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_h0ekplo'
      const userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID || 'vjXyYpLgDibpvaLPL'

      if (!serviceId || !templateId || !userId) {
        throw new Error('EmailJS configuration missing')
      }

      emailjs.init(userId)
      
      const templateParams = {
        to_email: email,
        to_name: fullName,
        subject: 'Welcome to New Bridge Community Church',
        message: `Dear ${fullName},

You have been invited to join the New Bridge Community Church family!

To complete your membership registration, please visit our website and create your account using this email address.

Registration Link: ${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/auth/register

We look forward to welcoming you to our church community.

Blessings,
NBCC Admin Team`
      }

      const emailResult = await emailjs.send(serviceId, templateId, templateParams)
      
      if (emailResult.status !== 200) {
        throw new Error(`EmailJS failed with status: ${emailResult.status}`)
      }

      return { email, fullName }
    })

    console.log('✅ Invitation email sent successfully:', result)
    return {
      success: true,
      message: 'Invitation email sent via EmailJS',
      data: result,
      service: 'emailjs'
    }

  }, 'invitation', email)
}

// Send password reset email using Supabase Auth with Rate Limiting and Monitoring
export const sendPasswordResetEmail = async (email) => {
  return await sendEmailWithMonitoring(async () => {
    console.log('Sending password reset email to:', email)

    // Check rate limiting status
    const status = getEmailSendingStatus()
    console.log('📊 Email rate limit status:', status)

    // Use rate-limited email sending
    const result = await sendEmailWithRateLimit(async () => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    })

    console.log('✅ Password reset email sent successfully')
    return {
      success: true,
      message: 'Password reset email sent',
      data: result,
      service: 'supabase'
    }

  }, 'password_reset', email)
}

// Send verification email using Supabase Auth with Rate Limiting and Monitoring
export const sendVerificationEmail = async (email) => {
  return await sendEmailWithMonitoring(async () => {
    console.log('Sending verification email to:', email)

    // Check rate limiting status
    const status = getEmailSendingStatus()
    console.log('📊 Email rate limit status:', status)

    // Use rate-limited email sending
    const result = await sendEmailWithRateLimit(async () => {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    })

    console.log('✅ Verification email sent successfully')
    return {
      success: true,
      message: 'Verification email sent',
      data: result,
      service: 'supabase'
    }

  }, 'verification', email)
}

// Hybrid email service - uses EmailJS for everything except verification
export const sendHybridEmail = async (templateParams, type = 'notification') => {
  try {
    console.log('=== HYBRID EMAIL SERVICE ===')
    console.log('Email type:', type)
    console.log('Recipient:', templateParams.to_email)

    // For verification emails, use Supabase
    if (type === 'verification') {
      return await sendVerificationEmail(templateParams.to_email)
    }

    // For all other emails (including invitations), use EmailJS
    console.log('Using EmailJS...')
    
    // Import EmailJS dynamically to avoid SSR issues
    const emailjs = (await import('emailjs-com')).default
    
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID

    if (!serviceId || !templateId || !userId) {
      throw new Error('EmailJS configuration missing')
    }

    emailjs.init(userId)
    
    const result = await emailjs.send(serviceId, templateId, templateParams)
    
    if (result.status === 200) {
      return {
        success: true,
        message: 'Email sent via EmailJS',
        service: 'emailjs',
        result: result
      }
    } else {
      throw new Error(`EmailJS failed with status: ${result.status}`)
    }

  } catch (error) {
    console.error('Hybrid email service error:', error)
    return { success: false, error: error.message }
  }
}

// Test email service connectivity
export const testEmailServices = async (testEmail) => {
  const results = {
    supabase: { available: false, error: null },
    emailjs: { available: false, error: null }
  }

  // Test Supabase
  try {
    if (supabase) {
      // Test if we can access auth admin functions
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!error) {
        results.supabase.available = true
      } else {
        results.supabase.error = error.message
      }
    }
  } catch (error) {
    results.supabase.error = error.message
  }

  // Test EmailJS
  try {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID

    if (serviceId && templateId && userId && 
        serviceId !== 'your_service_id' && 
        templateId !== 'your_template_id' && 
        userId !== 'your_user_id') {
      results.emailjs.available = true
    } else {
      results.emailjs.error = 'Configuration missing or contains placeholders'
    }
  } catch (error) {
    results.emailjs.error = error.message
  }

  return results
}

export default {
  sendEmailJSInvitation,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendHybridEmail,
  testEmailServices
}
