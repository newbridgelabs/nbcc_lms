import { supabase } from './supabase'

/**
 * Supabase Email Service
 * More reliable alternative to EmailJS using Supabase's built-in email functionality
 */

// Send invitation email using Supabase Auth
export const sendSupabaseInvitationEmail = async (email, fullName) => {
  try {
    console.log('Sending Supabase invitation email to:', email)

    // Use Supabase's built-in invite user functionality
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        invited_by: 'NBCC Admin',
        invitation_type: 'church_membership'
      },
      redirectTo: `${window.location.origin}/auth/callback?type=invite`
    })

    if (error) {
      console.error('Supabase invitation error:', error)
      return { success: false, error: error.message }
    }

    console.log('Supabase invitation sent successfully:', data)
    return {
      success: true,
      message: 'Invitation email sent via Supabase',
      data: data
    }

  } catch (error) {
    console.error('Supabase email service error:', error)
    return { success: false, error: error.message }
  }
}

// Send password reset email using Supabase Auth
export const sendPasswordResetEmail = async (email) => {
  try {
    console.log('Sending password reset email to:', email)

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      console.error('Password reset error:', error)
      return { success: false, error: error.message }
    }

    console.log('Password reset email sent successfully')
    return {
      success: true,
      message: 'Password reset email sent',
      data: data
    }

  } catch (error) {
    console.error('Password reset service error:', error)
    return { success: false, error: error.message }
  }
}

// Send verification email using Supabase Auth
export const sendVerificationEmail = async (email) => {
  try {
    console.log('Sending verification email to:', email)

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('Verification email error:', error)
      return { success: false, error: error.message }
    }

    console.log('Verification email sent successfully')
    return {
      success: true,
      message: 'Verification email sent',
      data: data
    }

  } catch (error) {
    console.error('Verification email service error:', error)
    return { success: false, error: error.message }
  }
}

// Hybrid email service - tries Supabase first, falls back to EmailJS
export const sendHybridEmail = async (templateParams, type = 'notification') => {
  try {
    console.log('=== HYBRID EMAIL SERVICE ===')
    console.log('Email type:', type)
    console.log('Recipient:', templateParams.to_email)

    // For invitation emails, try Supabase first
    if (type === 'invitation') {
      const supabaseResult = await sendSupabaseInvitationEmail(
        templateParams.to_email,
        templateParams.to_name
      )
      
      if (supabaseResult.success) {
        return supabaseResult
      } else {
        console.warn('Supabase invitation failed, falling back to EmailJS:', supabaseResult.error)
      }
    }

    // For verification emails, try Supabase
    if (type === 'verification') {
      const supabaseResult = await sendVerificationEmail(templateParams.to_email)
      
      if (supabaseResult.success) {
        return supabaseResult
      } else {
        console.warn('Supabase verification failed, falling back to EmailJS:', supabaseResult.error)
      }
    }

    // Fall back to EmailJS for other types or if Supabase fails
    console.log('Using EmailJS fallback...')
    
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
  sendSupabaseInvitationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendHybridEmail,
  testEmailServices
}
