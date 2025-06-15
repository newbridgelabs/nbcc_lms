import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, AlertTriangle, Edit, Database } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuickEmailFix() {
  const [loading, setLoading] = useState(true)
  const [allowedUsers, setAllowedUsers] = useState([])
  const [fixing, setFixing] = useState(false)

  useEffect(() => {
    loadAllowedUsers()
  }, [])

  const loadAllowedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('allowed_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllowedUsers(data || [])
    } catch (error) {
      console.error('Error loading allowed users:', error)
      toast.error('Failed to load allowed users')
    } finally {
      setLoading(false)
    }
  }

  const fixAlenEmail = async () => {
    setFixing(true)
    try {
      console.log('=== FIXING ALEN EMAIL ===')

      // Find the user with alenpr76@gmail.com
      const alenUser = allowedUsers.find(user => 
        user.email === 'alenpr76@gmail.com' || 
        user.full_name?.toLowerCase().includes('alen')
      )

      if (!alenUser) {
        throw new Error('Could not find Alen in the allowed users list')
      }

      console.log('Found Alen user:', alenUser)

      // Update the email to the correct one
      const { data, error } = await supabase
        .from('allowed_users')
        .update({
          email: 'alenps76@gmail.com'
        })
        .eq('id', alenUser.id)
        .select()
        .single()

      if (error) throw error

      console.log('Updated user:', data)

      toast.success('✅ Email fixed! Alen can now register with alenps76@gmail.com')
      
      // Reload the data
      await loadAllowedUsers()

    } catch (error) {
      console.error('Fix error:', error)
      toast.error('Failed to fix email: ' + error.message)
    } finally {
      setFixing(false)
    }
  }

  const testRegistrationCheck = async () => {
    try {
      console.log('=== TESTING REGISTRATION CHECK ===')
      
      // Test the exact same check that registration does
      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', 'alenps76@gmail.com')
        .eq('is_used', false)
        .single()

      console.log('Registration check result:', { allowedUser, allowedError })

      if (allowedError || !allowedUser) {
        toast.error('❌ Registration would still fail: ' + (allowedError?.message || 'User not found'))
      } else {
        toast.success('✅ Registration check passed! Alen can now register.')
      }

    } catch (error) {
      console.error('Test error:', error)
      toast.error('Test failed: ' + error.message)
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
              <div className="flex items-center">
                <Database className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Quick Email Fix for Alen
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Fix the email address mismatch to allow registration
              </p>
            </div>

            <div className="p-6">
              {/* Current Allowed Users */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Current Allowed Users</h2>
                <div className="space-y-2">
                  {allowedUsers.map((user) => (
                    <div key={user.id} className={`p-3 rounded-lg border ${
                      user.email.includes('alen') ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            Used: {user.is_used ? 'Yes' : 'No'} | 
                            Created: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {user.email.includes('alen') && (
                          <div className="text-yellow-600">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fix Actions */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Fix Actions</h2>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-medium text-red-800 mb-2">Problem:</h3>
                    <p className="text-sm text-red-700">
                      Database has: <code>alenpr76@gmail.com</code><br/>
                      User trying to register with: <code>alenps76@gmail.com</code><br/>
                      This mismatch causes "contact church administration" error.
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={fixAlenEmail}
                      disabled={fixing}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {fixing ? (
                        <>
                          <div className="loading-spinner w-4 h-4 mr-2"></div>
                          Fixing...
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Fix Email Address
                        </>
                      )}
                    </button>

                    <button
                      onClick={testRegistrationCheck}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Test Registration Check
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Instructions</h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Steps to Fix:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Click "Fix Email Address" to update the database</li>
                      <li>Click "Test Registration Check" to verify the fix</li>
                      <li>Ask Alen to try registering again with alenps76@gmail.com</li>
                      <li>The registration should now work properly</li>
                    </ol>
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
