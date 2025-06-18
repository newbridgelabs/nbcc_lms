// Email Delivery Monitoring and Logging System
import { supabase } from './supabase'

class EmailMonitor {
  constructor() {
    this.logs = []
    this.maxLogs = 100 // Keep last 100 email attempts
  }

  // Log email attempt
  async logEmailAttempt(type, recipient, status, details = {}) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type, // 'invitation', 'verification', 'password_reset', 'notification'
      recipient,
      status, // 'success', 'failed', 'rate_limited', 'pending'
      details,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server'
    }

    // Add to local logs
    this.logs.unshift(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('emailLogs', JSON.stringify(this.logs.slice(0, 50)))
      } catch (error) {
        console.warn('Could not save email logs to localStorage:', error)
      }
    }

    // Log to console with emoji for easy identification
    const emoji = this.getStatusEmoji(status)
    console.log(`${emoji} Email ${status.toUpperCase()}: ${type} to ${recipient}`, details)

    // Try to store in Supabase (optional, for admin monitoring)
    try {
      if (supabase) {
        await this.storeInSupabase(logEntry)
      }
    } catch (error) {
      console.warn('Could not store email log in Supabase:', error)
    }

    return logEntry
  }

  // Store log in Supabase for admin monitoring
  async storeInSupabase(logEntry) {
    try {
      const { error } = await supabase
        .from('email_logs')
        .insert([{
          email_type: logEntry.type,
          recipient: logEntry.recipient,
          status: logEntry.status,
          details: logEntry.details,
          timestamp: logEntry.timestamp,
          user_agent: logEntry.userAgent,
          url: logEntry.url
        }])

      if (error && !error.message.includes('relation "email_logs" does not exist')) {
        console.warn('Supabase email log error:', error)
      }
    } catch (error) {
      // Silently fail if table doesn't exist
      console.debug('Email logs table not available:', error.message)
    }
  }

  // Get status emoji for console logging
  getStatusEmoji(status) {
    const emojis = {
      success: '✅',
      failed: '❌',
      rate_limited: '🚫',
      pending: '⏳',
      warning: '⚠️'
    }
    return emojis[status] || '📧'
  }

  // Load logs from localStorage
  loadLogs() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('emailLogs')
        if (stored) {
          this.logs = JSON.parse(stored)
        }
      } catch (error) {
        console.warn('Could not load email logs from localStorage:', error)
      }
    }
  }

  // Get recent logs
  getRecentLogs(limit = 20) {
    return this.logs.slice(0, limit)
  }

  // Get logs by status
  getLogsByStatus(status) {
    return this.logs.filter(log => log.status === status)
  }

  // Get logs by type
  getLogsByType(type) {
    return this.logs.filter(log => log.type === type)
  }

  // Get logs for specific recipient
  getLogsForRecipient(recipient) {
    return this.logs.filter(log => log.recipient === recipient)
  }

  // Get email statistics
  getStatistics() {
    const total = this.logs.length
    const successful = this.logs.filter(log => log.status === 'success').length
    const failed = this.logs.filter(log => log.status === 'failed').length
    const rateLimited = this.logs.filter(log => log.status === 'rate_limited').length

    const last24Hours = this.logs.filter(log => {
      const logTime = new Date(log.timestamp)
      const now = new Date()
      return (now - logTime) < (24 * 60 * 60 * 1000)
    })

    return {
      total,
      successful,
      failed,
      rateLimited,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : 0,
      last24Hours: last24Hours.length,
      byType: this.getTypeStatistics(),
      recentErrors: this.getRecentErrors()
    }
  }

  // Get statistics by email type
  getTypeStatistics() {
    const types = {}
    this.logs.forEach(log => {
      if (!types[log.type]) {
        types[log.type] = { total: 0, successful: 0, failed: 0 }
      }
      types[log.type].total++
      if (log.status === 'success') types[log.type].successful++
      if (log.status === 'failed') types[log.type].failed++
    })
    return types
  }

  // Get recent errors for troubleshooting
  getRecentErrors(limit = 10) {
    return this.logs
      .filter(log => log.status === 'failed' || log.status === 'rate_limited')
      .slice(0, limit)
      .map(log => ({
        timestamp: log.timestamp,
        type: log.type,
        recipient: log.recipient,
        error: log.details?.error || log.details?.message || 'Unknown error'
      }))
  }

  // Clear old logs
  clearOldLogs(daysToKeep = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    this.logs = this.logs.filter(log => {
      const logDate = new Date(log.timestamp)
      return logDate > cutoffDate
    })

    // Update localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('emailLogs', JSON.stringify(this.logs))
      } catch (error) {
        console.warn('Could not update email logs in localStorage:', error)
      }
    }
  }

  // Export logs for analysis
  exportLogs() {
    return {
      exportDate: new Date().toISOString(),
      totalLogs: this.logs.length,
      statistics: this.getStatistics(),
      logs: this.logs
    }
  }
}

// Create singleton instance
const emailMonitor = new EmailMonitor()

// Load existing logs on initialization
emailMonitor.loadLogs()

// Enhanced email sending wrapper with monitoring
export const sendEmailWithMonitoring = async (emailFunction, type, recipient, ...args) => {
  const startTime = Date.now()
  
  try {
    // Log attempt start
    await emailMonitor.logEmailAttempt(type, recipient, 'pending', {
      startTime: new Date().toISOString(),
      args: args.length
    })

    // Execute email function
    const result = await emailFunction(...args)
    const duration = Date.now() - startTime

    // Log success
    await emailMonitor.logEmailAttempt(type, recipient, 'success', {
      duration,
      result: result?.success ? 'success' : 'partial',
      service: result?.service || 'supabase',
      endTime: new Date().toISOString()
    })

    return result

  } catch (error) {
    const duration = Date.now() - startTime
    
    // Determine error type
    let status = 'failed'
    if (error.message.includes('rate limit') || 
        error.message.includes('too many requests') ||
        error.message.includes('email rate limit exceeded')) {
      status = 'rate_limited'
    }

    // Log failure
    await emailMonitor.logEmailAttempt(type, recipient, status, {
      duration,
      error: error.message,
      stack: error.stack,
      endTime: new Date().toISOString()
    })

    throw error
  }
}

// Export monitor instance and utilities
export { emailMonitor }

export const getEmailStatistics = () => emailMonitor.getStatistics()
export const getRecentEmailLogs = (limit) => emailMonitor.getRecentLogs(limit)
export const getEmailLogsForRecipient = (recipient) => emailMonitor.getLogsForRecipient(recipient)
export const clearOldEmailLogs = (days) => emailMonitor.clearOldLogs(days)
export const exportEmailLogs = () => emailMonitor.exportLogs()

export default {
  sendEmailWithMonitoring,
  emailMonitor,
  getEmailStatistics,
  getRecentEmailLogs,
  getEmailLogsForRecipient,
  clearOldEmailLogs,
  exportEmailLogs
}
