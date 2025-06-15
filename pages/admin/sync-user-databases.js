import { useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { Database, RefreshCw, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SyncUserDatabases() {
  const [syncing, setSyncing] = useState(false)
  const [results, setResults] = useState(null)

  const syncDatabases = async () => {
    setSyncing(true)
    setResults(null)

    const syncResults = {
      orphanedAllowedUsers: [],
      activeUsers: [],
      resetCount: 0,
      errors: []
    }

    try {
      console.log('=== SYNCING USER DATABASES ===')

      // 1. Get all users from the users table
      const { data: activeUsers, error: usersError } = await supabase
        .from('users')
        .select('id, email')

      if (usersError) {
        syncResults.errors.push(`Failed to get active users: ${usersError.message}`)
      } else {
        syncResults.activeUsers = activeUsers || []
        console.log('Active users:', activeUsers)
      }

      // 2. Get all allowed_users that are marked as used
      const { data: usedAllowedUsers, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('is_used', true)

      if (allowedError) {
        syncResults.errors.push(`Failed to get used allowed users: ${allowedError.message}`)
      } else {
        console.log('Used allowed users:', usedAllowedUsers)

        // 3. Find orphaned allowed_users (marked as used but no corresponding user in users table)
        const activeUserEmails = new Set(syncResults.activeUsers.map(u => u.email.toLowerCase()))
        
        syncResults.orphanedAllowedUsers = usedAllowedUsers.filter(allowedUser => 
          !activeUserEmails.has(allowedUser.email.toLowerCase())
        )

        console.log('Orphaned allowed users:', syncResults.orphanedAllowedUsers)

        // 4. Reset orphaned allowed_users
        if (syncResults.orphanedAllowedUsers.length > 0) {
          for (const orphanedUser of syncResults.orphanedAllowedUsers) {
            try {
              const { error: resetError } = await supabase
                .from('allowed_users')
                .update({
                  is_used: false,
                  registered_at: null
                })
                .eq('id', orphanedUser.id)

              if (resetError) {
                syncResults.errors.push(`Failed to reset ${orphanedUser.email}: ${resetError.message}`)
              } else {
                syncResults.resetCount++
                console.log(`Reset ${orphanedUser.email}`)
              }
            } catch (error) {
              syncResults.errors.push(`Error resetting ${orphanedUser.email}: ${error.message}`)
            }
          }
        }
      }

      setResults(syncResults)

      if (syncResults.resetCount > 0) {
        toast.success(`✅ Reset ${syncResults.resetCount} orphaned user(s)`)
      } else if (syncResults.orphanedAllowedUsers.length === 0) {
        toast.success('✅ Databases are already in sync')
      }

    } catch (error) {
      console.error('Sync error:', error)
      syncResults.errors.push(`Sync error: ${error.message}`)
      setResults(syncResults)
      toast.error('Sync failed: ' + error.message)
    } finally {
      setSyncing(false)
    }
  }

  const resetSpecificUser = async (email) => {
    try {
      console.log('Resetting specific user:', email)

      const { data, error } = await supabase
        .from('allowed_users')
        .update({
          is_used: false,
          registered_at: null
        })
        .eq('email', email.toLowerCase())
        .select()

      if (error) throw error

      console.log('Reset user:', data)
      toast.success(`✅ Reset ${email} - they can now register again`)
      
      // Re-run sync to update results
      await syncDatabases()

    } catch (error) {
      console.error('Reset error:', error)
      toast.error('Failed to reset user: ' + error.message)
    }
  }

  const testAlenRegistration = async () => {
    try {
      // Test the exact registration check for Alen
      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', 'alenps76@gmail.com')
        .eq('is_used', false)
        .single()

      if (allowedError || !allowedUser) {
        toast.error(`❌ Alen still cannot register: ${allowedError?.message || 'User not found or already used'}`)
      } else {
        toast.success('✅ Alen can now register successfully!')
      }
    } catch (error) {
      toast.error('Test failed: ' + error.message)
    }
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Database className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Sync User Databases
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Fix orphaned allowed_users entries when users are deleted
              </p>
            </div>

            <div className="p-6">
              {/* Problem Explanation */}
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-yellow-800 mb-2">Database Sync Issue</h3>
                    <p className="text-sm text-yellow-700">
                      When you delete a user from the User Management page, they're removed from the <code>users</code> table 
                      but their entry in the <code>allowed_users</code> table remains marked as "used". This prevents them 
                      from registering again.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mb-6 flex flex-wrap gap-4">
                <button
                  onClick={syncDatabases}
                  disabled={syncing}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {syncing ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Databases
                    </>
                  )}
                </button>

                <button
                  onClick={() => resetSpecificUser('alenps76@gmail.com')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reset Alen Specifically
                </button>

                <button
                  onClick={testAlenRegistration}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test Alen Registration
                </button>
              </div>

              {/* Results */}
              {results && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Sync Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{results.activeUsers.length}</p>
                        <p className="text-gray-600">Active Users</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{results.orphanedAllowedUsers.length}</p>
                        <p className="text-gray-600">Orphaned Entries</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{results.resetCount}</p>
                        <p className="text-gray-600">Reset Users</p>
                      </div>
                    </div>
                  </div>

                  {/* Orphaned Users */}
                  {results.orphanedAllowedUsers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Orphaned Allowed Users ({results.orphanedAllowedUsers.length})
                      </h3>
                      <div className="space-y-2">
                        {results.orphanedAllowedUsers.map((user) => (
                          <div key={user.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{user.full_name}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                <p className="text-xs text-gray-400">
                                  Marked as used but no active user account
                                </p>
                              </div>
                              <button
                                onClick={() => resetSpecificUser(user.email)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Users */}
                  {results.activeUsers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Active Users ({results.activeUsers.length})
                      </h3>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {results.activeUsers.map((user) => (
                          <div key={user.id} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                            <p>{user.email}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {results.errors.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-red-900 mb-3">Errors</h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                          {results.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">How This Works</h2>
                <div className="space-y-4 text-sm">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Sync Process:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Check all active users in the users table</li>
                      <li>Find allowed_users marked as "used" but with no corresponding active user</li>
                      <li>Reset these orphaned entries so they can register again</li>
                      <li>Verify the fix by testing registration</li>
                    </ol>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-800 mb-2">For Alen Specifically:</h3>
                    <p className="text-green-700">
                      Since you deleted Alen from User Management, his allowed_users entry is orphaned. 
                      Click "Reset Alen Specifically" or "Sync Databases" to fix this and allow him to register again.
                    </p>
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
