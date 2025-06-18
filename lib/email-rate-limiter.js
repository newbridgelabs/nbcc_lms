// Email Rate Limiter for Supabase
// Helps manage email sending to avoid rate limits

class EmailRateLimiter {
  constructor() {
    this.emailLog = []
    this.maxEmailsPerHour = 30  // Supabase free tier limit
    this.maxEmailsPerMinute = 3 // Supabase free tier limit
    this.cooldownPeriod = 60 * 60 * 1000 // 1 hour in milliseconds
  }

  // Check if we can send an email without hitting rate limits
  canSendEmail() {
    const now = Date.now()
    
    // Clean old entries (older than 1 hour)
    this.emailLog = this.emailLog.filter(timestamp => 
      now - timestamp < this.cooldownPeriod
    )

    // Check hourly limit
    const emailsInLastHour = this.emailLog.length
    if (emailsInLastHour >= this.maxEmailsPerHour) {
      return {
        canSend: false,
        reason: 'hourly_limit',
        message: `Hourly limit reached (${emailsInLastHour}/${this.maxEmailsPerHour}). Wait ${this.getTimeUntilReset()} minutes.`,
        waitTime: this.getTimeUntilReset()
      }
    }

    // Check minute limit (last 60 seconds)
    const oneMinuteAgo = now - (60 * 1000)
    const emailsInLastMinute = this.emailLog.filter(timestamp => 
      timestamp > oneMinuteAgo
    ).length

    if (emailsInLastMinute >= this.maxEmailsPerMinute) {
      return {
        canSend: false,
        reason: 'minute_limit',
        message: `Minute limit reached (${emailsInLastMinute}/${this.maxEmailsPerMinute}). Wait 60 seconds.`,
        waitTime: 1
      }
    }

    return {
      canSend: true,
      remaining: {
        hourly: this.maxEmailsPerHour - emailsInLastHour,
        minute: this.maxEmailsPerMinute - emailsInLastMinute
      }
    }
  }

  // Record that an email was sent
  recordEmailSent() {
    this.emailLog.push(Date.now())
  }

  // Get time until rate limit resets (in minutes)
  getTimeUntilReset() {
    if (this.emailLog.length === 0) return 0
    
    const oldestEmail = Math.min(...this.emailLog)
    const resetTime = oldestEmail + this.cooldownPeriod
    const now = Date.now()
    
    if (resetTime <= now) return 0
    
    return Math.ceil((resetTime - now) / (60 * 1000)) // Convert to minutes
  }

  // Get current status
  getStatus() {
    const now = Date.now()
    
    // Clean old entries
    this.emailLog = this.emailLog.filter(timestamp => 
      now - timestamp < this.cooldownPeriod
    )

    const oneMinuteAgo = now - (60 * 1000)
    const emailsInLastHour = this.emailLog.length
    const emailsInLastMinute = this.emailLog.filter(timestamp => 
      timestamp > oneMinuteAgo
    ).length

    return {
      emailsInLastHour,
      emailsInLastMinute,
      remainingHourly: Math.max(0, this.maxEmailsPerHour - emailsInLastHour),
      remainingMinute: Math.max(0, this.maxEmailsPerMinute - emailsInLastMinute),
      timeUntilReset: this.getTimeUntilReset(),
      limits: {
        hourly: this.maxEmailsPerHour,
        minute: this.maxEmailsPerMinute
      }
    }
  }

  // Wait for safe sending (returns a promise)
  async waitForSafeSending() {
    const check = this.canSendEmail()
    
    if (check.canSend) {
      return true
    }

    const waitTimeMs = check.reason === 'minute_limit' 
      ? 60 * 1000  // Wait 1 minute
      : check.waitTime * 60 * 1000 // Wait specified minutes

    console.log(`⏳ Waiting ${Math.ceil(waitTimeMs / 1000)} seconds to avoid rate limit...`)
    
    await new Promise(resolve => setTimeout(resolve, waitTimeMs))
    
    // Check again after waiting
    return this.canSendEmail().canSend
  }
}

// Create a singleton instance
const emailRateLimiter = new EmailRateLimiter()

// Enhanced email sending function with rate limiting
export const sendEmailWithRateLimit = async (emailFunction, ...args) => {
  try {
    // Check if we can send
    const check = emailRateLimiter.canSendEmail()
    
    if (!check.canSend) {
      throw new Error(`Rate limit exceeded: ${check.message}`)
    }

    // Record that we're about to send
    emailRateLimiter.recordEmailSent()

    // Send the email
    const result = await emailFunction(...args)
    
    console.log('✅ Email sent successfully with rate limiting')
    return result

  } catch (error) {
    // If it's a rate limit error from Supabase, update our tracker
    const errorMessage = error?.message || 'Unknown error'
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests') ||
        errorMessage.includes('email rate limit exceeded')) {
      
      // Mark several emails as sent to prevent immediate retries
      for (let i = 0; i < 5; i++) {
        emailRateLimiter.recordEmailSent()
      }
      
      throw new Error(`Supabase rate limit exceeded. Wait ${emailRateLimiter.getTimeUntilReset()} minutes before trying again.`)
    }
    
    throw error
  }
}

// Export the rate limiter for direct use
export { emailRateLimiter }

// Helper function to check email sending status
export const getEmailSendingStatus = () => {
  return emailRateLimiter.getStatus()
}

// Helper function to wait for safe sending
export const waitForSafeEmailSending = () => {
  return emailRateLimiter.waitForSafeSending()
}

export default {
  sendEmailWithRateLimit,
  emailRateLimiter,
  getEmailSendingStatus,
  waitForSafeEmailSending
}
