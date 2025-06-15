import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { RefreshCw, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FixUserStatus() {
  const [loading, setLoading] = useState(true)
  const [alenUsers, setAlenUsers] = useState([])
  const [fixing, setFixing] = useState(false)

  useEffect(() => {
    loadAlenUsers()
  }, [])

  const loadAlenUsers = async () => {
    try {
      // Find all users with alen in email or name
      const { data, error } = await supabase
        .from('allowed_users')
        .select('*')
        .or(`email.ilike.%alen%,full_name.ilike.%alen%`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAlenUsers(data || [])
      console.log('Found Alen users:', data)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const resetUserStatus = async (userId, userEmail) => {
    setFixing(true)
    try {
      console.log('Resetting user status for:', userId, userEmail)

      const { data, error } = await supabase
        .from('allowed_users')
        .update({
          is_used: false,
          registered_at: null
        })
        .eq('id', userId)
        .select()

      if (error) throw error

      console.log('Reset user:', data)
      toast.success(`✅ User status reset! ${userEmail} can now register.`)
      
      await loadAlenUsers()
    } catch (error) {
      console.error('Reset error:', error)
      toast.error('Failed to reset user: ' + error.message)
    } finally {
      setFixing(false)
    }
  }

  const deleteUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to delete ${userEmail}?`)) {
      return
    }

    setFixing(true)
    try {
      const { error } = await supabase
        .from('allowed_users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      toast.success(`User ${userEmail} deleted successfully`)
      await loadAlenUsers()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete user: ' + error.message)
    } finally {
      setFixing(false)
    }
  }

  const testRegistration = async (email) => {
    try {
      console.log('Testing registration for:', email)

      // Exact same check as registration code
      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_used', false)
        .single()

      console.log('Registration test result:', { allowedUser, allowedError })

      if (allowedError || !allowedUser) {
        toast.error(`❌ Registration would fail: ${allowedError?.message || 'User not found or already used'}`)
      } else {
        toast.success(`✅ Registration would succeed for ${email}!`)
      }
    } catch (error) {
      console.error('Test error:', error)
      toast.error('Test failed: ' + error.message)
    }
  }

  const addCorrectUser = async () => {
    setFixing(true)
    try {
      const { data, error } = await supabase
        .from('allowed_users')
        .insert({
          email: 'alenps76@gmail.com',
          full_name: 'Alen Pradeep',
          is_used: false
        })
        .select()

      if (error) {
        if (error.code === '23505') {
          toast.error('User already exists - use reset instead')
        } else {
          throw error
        }
      } else {
        toast.success('User added successfully!')
        await loadAlenUsers()
      }
    } catch (error) {
      console.error('Add error:', error)
      toast.error('Failed to add user: ' + error.message)
    } finally {
      setFixing(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      Fix Alen's User Status
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Reset user status to allow registration
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadAlenUsers}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Current Status */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Found Users ({alenUsers.length})
                </h2>
                
                {alenUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Alen users found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      The user might not exist in the allowed_users table
                    </p>
                    <button
                      onClick={addCorrectUser}
                      disabled={fixing}
                      className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Add Correct User
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alenUsers.map((user) => (
                      <div key={user.id} className={`p-4 rounded-lg border ${
                        user.is_used 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="font-medium text-gray-900">{user.full_name}</h3>
                              <div className="ml-2">
                                {user.is_used ? (
                                  <XCircle className="h-5 w-5 text-red-500" title="Already used" />
                                ) : (
                                  <CheckCircle className="h-5 w-5 text-green-500" title="Available" />
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Email:</strong> {user.email}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Status:</strong> {user.is_used ? 'Already Used' : 'Available'}
                            </p>
                            <p className="text-xs text-gray-400">
                              Created: {new Date(user.created_at).toLocaleString()}
                              {user.registered_at && (
                                <span className="ml-2">
                                  | Registered: {new Date(user.registered_at).toLocaleString()}
                                </span>
                              )}
                            </p>
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <button
                              onClick={() => testRegistration(user.email)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              Test Registration
                            </button>
                            
                            {user.is_used && (
                              <button
                                onClick={() => resetUserStatus(user.id, user.email)}
                                disabled={fixing}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                              >
                                Reset Status
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteUser(user.id, user.email)}
                              disabled={fixing}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Instructions</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">How to Fix:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
                    <li>If user shows "Already Used" (red), click "Reset Status"</li>
                    <li>Click "Test Registration" to verify the fix</li>
                    <li>If no users found, click "Add Correct User"</li>
                    <li>Ask Alen to try registering with alenps76@gmail.com</li>
                  </ol>
                </div>
                
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">Common Issues:</h3>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                    <li>User marked as "is_used = true" from previous registration attempt</li>
                    <li>Multiple duplicate entries in the database</li>
                    <li>Email case sensitivity issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
