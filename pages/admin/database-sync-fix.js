import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { Database, User, Trash2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DatabaseSyncFix() {
  const [loading, setLoading] = useState(false)
  const [targetEmail, setTargetEmail] = useState('alenps76@gmail.com')
  const [syncStatus, setSyncStatus] = useState(null)
  const [fixing, setFixing] = useState(false)

  const checkDatabaseSync = async () => {
    setLoading(true)
    setSyncStatus(null)

    try {
      console.log('=== DATABASE SYNC CHECK ===')
      console.log('Checking email:', targetEmail)

      const status = {
        email: targetEmail.toLowerCase(),
        allowedUsers: null,
        customUsers: null,
        authUsers: null,
        syncIssues: [],
        canRegister: false
      }

      // Check 1: allowed_users table
      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', targetEmail.toLowerCase())
        .single()

      if (allowedError && allowedError.code !== 'PGRST116') {
        status.syncIssues.push(`Error checking allowed_users: ${allowedError.message}`)
      } else {
        status.allowedUsers = allowedUser || null
      }

      // Check 2: custom users table
      const { data: customUser, error: customError } = await supabase
        .from('users')
        .select('*')
        .eq('email', targetEmail.toLowerCase())
        .single()

      if (customError && customError.code !== 'PGRST116') {
        status.syncIssues.push(`Error checking users table: ${customError.message}`)
      } else {
        status.customUsers = customUser || null
      }

      // Check 3: Try to detect auth.users existence (indirect method)
      // We can't directly query auth.users, but we can try to sign in with a fake password
      let authUserExists = false
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: targetEmail.toLowerCase(),
          password: 'fake-password-for-testing-123'
        })
        
        // If error is "Invalid login credentials", user exists but password is wrong
        // If error is "User not found" or similar, user doesn't exist
        if (signInError?.message?.includes('Invalid login credentials') || 
            signInError?.message?.includes('Invalid email or password')) {
          authUserExists = true
        }
      } catch (testError) {
        console.log('Auth test error:', testError)
      }

      status.authUsers = authUserExists

      // Analyze sync issues
      if (status.authUsers && !status.customUsers) {
        status.syncIssues.push('User exists in auth.users but not in custom users table')
      }
      
      if (status.customUsers && !status.authUsers) {
        status.syncIssues.push('User exists in custom users table but not in auth.users')
      }

      if (!status.allowedUsers) {
        status.syncIssues.push('User not in allowed_users table')
      } else if (status.allowedUsers.is_used && status.authUsers) {
        status.syncIssues.push('User marked as used in allowed_users and exists in auth - cannot register again')
      }

      // Determine if user can register
      status.canRegister = status.allowedUsers && !status.allowedUsers.is_used && !status.authUsers

      setSyncStatus(status)
      console.log('Sync status:', status)

    } catch (error) {
      console.error('Sync check error:', error)
      toast.error('Failed to check database sync: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fixDatabaseSync = async () => {
    if (!syncStatus) {
      toast.error('Please run sync check first')
      return
    }

    setFixing(true)
    try {
      console.log('=== FIXING DATABASE SYNC ===')
      let fixSteps = []

      // Step 1: Clean up custom users table if user exists there
      if (syncStatus.customUsers) {
        fixSteps.push('Removing user from custom users table...')
        const { error: deleteCustomError } = await supabase
          .from('users')
          .delete()
          .eq('email', targetEmail.toLowerCase())

        if (deleteCustomError) {
          throw new Error(`Failed to delete from users table: ${deleteCustomError.message}`)
        }
        fixSteps.push('✅ Removed from custom users table')
      }

      // Step 2: Reset allowed_users status
      if (syncStatus.allowedUsers) {
        if (syncStatus.allowedUsers.is_used) {
          fixSteps.push('Resetting allowed_users status...')
          const { error: resetError } = await supabase
            .from('allowed_users')
            .update({ 
              is_used: false,
              reset_at: new Date().toISOString(),
              reset_reason: 'Database sync fix'
            })
            .eq('email', targetEmail.toLowerCase())

          if (resetError) {
            throw new Error(`Failed to reset allowed_users: ${resetError.message}`)
          }
          fixSteps.push('✅ Reset allowed_users status')
        }
      } else {
        // Add user to allowed_users if not present
        fixSteps.push('Adding user to allowed_users...')
        const { error: insertError } = await supabase
          .from('allowed_users')
          .insert({
            email: targetEmail.toLowerCase(),
            full_name: targetEmail.split('@')[0], // Use email prefix as name
            invited_by: 'admin',
            invitation_sent_at: new Date().toISOString(),
            is_used: false
          })

        if (insertError) {
          throw new Error(`Failed to add to allowed_users: ${insertError.message}`)
        }
        fixSteps.push('✅ Added to allowed_users')
      }

      // Step 3: Clean up auth.users using admin API
      if (syncStatus.authUsers) {
        fixSteps.push('Cleaning up auth.users...')

        const response = await fetch('/api/admin/cleanup-auth-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: targetEmail.toLowerCase() })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(`Auth cleanup failed: ${result.error}`)
        }

        if (result.userFound) {
          fixSteps.push('✅ Deleted user from auth.users')
          fixSteps.push('✅ Complete database cleanup successful')
        } else {
          fixSteps.push('✅ User was already clean in auth.users')
        }
      }

      // Show results
      fixSteps.forEach(step => {
        console.log(step)
        toast.success(step, { duration: 2000 })
      })

      toast.success('Database sync fix completed! User should now be able to register.')
      
      // Refresh sync status
      setTimeout(() => {
        checkDatabaseSync()
      }, 1000)

    } catch (error) {
      console.error('Fix failed:', error)
      toast.error('Fix failed: ' + error.message)
    } finally {
      setFixing(false)
    }
  }

  const manualAuthCleanup = () => {
    const instructions = `
Manual Auth Cleanup Instructions:

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to: Authentication → Users
4. Search for: ${targetEmail}
5. If user exists, click the delete button (trash icon)
6. Confirm deletion
7. Come back and run the sync check again

This will completely remove the user from Supabase's authentication system, 
allowing them to register fresh with email confirmation.
    `.trim()

    navigator.clipboard.writeText(instructions).then(() => {
      toast.success('Instructions copied to clipboard!')
    }).catch(() => {
      toast.error('Could not copy to clipboard')
    })
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center">
              <Database className="h-6 w-6 mr-2 text-blue-600" />
              Database Sync Fix Tool
            </h1>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Database Sync Issue Detected
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    When users are deleted from admin panel, they might still exist in Supabase's auth.users table, 
                    preventing new registration and email confirmation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Email to Check
                  </label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email to check"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={checkDatabaseSync}
                    disabled={loading || !targetEmail}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Check Sync
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={fixDatabaseSync}
                    disabled={!syncStatus || fixing}
                    className="w-full bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
                  >
                    {fixing ? 'Fixing...' : 'Fix Database Sync'}
                  </button>
                  
                  <button
                    onClick={manualAuthCleanup}
                    className="w-full bg-orange-600 text-white py-2 px-3 rounded-md hover:bg-orange-700 text-sm"
                  >
                    Copy Manual Cleanup Instructions
                  </button>
                </div>
              </div>
            </div>
          </div>

          {syncStatus && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Database Sync Status for {syncStatus.email}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Allowed Users
                  </h3>
                  <div className="flex items-center">
                    {syncStatus.allowedUsers ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className="text-sm">
                      {syncStatus.allowedUsers 
                        ? `Present (Used: ${syncStatus.allowedUsers.is_used ? 'Yes' : 'No'})`
                        : 'Not found'
                      }
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-1" />
                    Custom Users
                  </h3>
                  <div className="flex items-center">
                    {syncStatus.customUsers ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className="text-sm">
                      {syncStatus.customUsers ? 'Present' : 'Not found'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Auth Users
                  </h3>
                  <div className="flex items-center">
                    {syncStatus.authUsers ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    )}
                    <span className="text-sm">
                      {syncStatus.authUsers ? 'Present (ISSUE!)' : 'Not found (Good)'}
                    </span>
                  </div>
                </div>
              </div>

              {syncStatus.syncIssues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <h3 className="font-medium text-red-900 mb-2">Sync Issues Found:</h3>
                  <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                    {syncStatus.syncIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={`p-4 rounded-md ${
                syncStatus.canRegister 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`font-medium mb-2 ${
                  syncStatus.canRegister ? 'text-green-900' : 'text-red-900'
                }`}>
                  Registration Status:
                </h3>
                <p className={`text-sm ${
                  syncStatus.canRegister ? 'text-green-800' : 'text-red-800'
                }`}>
                  {syncStatus.canRegister 
                    ? '✅ User can register and receive email confirmation'
                    : '❌ User cannot register due to sync issues'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
