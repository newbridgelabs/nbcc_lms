import { useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { Search, Database, User, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegistrationDebug() {
  const [debugging, setDebugging] = useState(false)
  const [results, setResults] = useState(null)
  const [testEmail, setTestEmail] = useState('alenps76@gmail.com')

  const runFullDebug = async () => {
    setDebugging(true)
    setResults(null)

    const debug = {
      allAllowedUsers: [],
      emailSearchResults: [],
      registrationCheck: null,
      errors: []
    }

    try {
      console.log('=== FULL REGISTRATION DEBUG ===')
      console.log('Testing email:', testEmail)

      // 1. Get ALL allowed users
      const { data: allUsers, error: allError } = await supabase
        .from('allowed_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (allError) {
        debug.errors.push(`Failed to get all users: ${allError.message}`)
      } else {
        debug.allAllowedUsers = allUsers || []
        console.log('All allowed users:', allUsers)
      }

      // 2. Search for emails containing 'alen'
      const { data: alenUsers, error: alenError } = await supabase
        .from('allowed_users')
        .select('*')
        .or(`email.ilike.%alen%,full_name.ilike.%alen%`)

      if (alenError) {
        debug.errors.push(`Failed to search for alen: ${alenError.message}`)
      } else {
        debug.emailSearchResults = alenUsers || []
        console.log('Alen search results:', alenUsers)
      }

      // 3. Test exact registration check
      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', testEmail.toLowerCase())
        .eq('is_used', false)
        .single()

      debug.registrationCheck = {
        email: testEmail.toLowerCase(),
        allowedUser: allowedUser,
        error: allowedError?.message || null,
        success: !allowedError && allowedUser
      }

      console.log('Registration check result:', debug.registrationCheck)

      // 4. Also check without is_used filter
      const { data: anyUser, error: anyError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', testEmail.toLowerCase())
        .single()

      debug.registrationCheck.anyUser = anyUser
      debug.registrationCheck.anyError = anyError?.message || null

      setResults(debug)

    } catch (error) {
      console.error('Debug error:', error)
      debug.errors.push(`Debug error: ${error.message}`)
      setResults(debug)
    } finally {
      setDebugging(false)
    }
  }

  const fixEmailDirectly = async () => {
    try {
      console.log('=== DIRECT EMAIL FIX ===')

      // Find any user with email containing 'alenpr'
      const { data: users, error } = await supabase
        .from('allowed_users')
        .select('*')
        .ilike('email', '%alenpr%')

      if (error) throw error

      if (users && users.length > 0) {
        const user = users[0]
        console.log('Found user to fix:', user)

        // Update to correct email
        const { data: updated, error: updateError } = await supabase
          .from('allowed_users')
          .update({ email: 'alenps76@gmail.com' })
          .eq('id', user.id)
          .select()

        if (updateError) throw updateError

        console.log('Updated user:', updated)
        toast.success('Email fixed successfully!')
        
        // Re-run debug
        await runFullDebug()
      } else {
        toast.error('No user found with alenpr email')
      }

    } catch (error) {
      console.error('Fix error:', error)
      toast.error('Fix failed: ' + error.message)
    }
  }

  const addTestUser = async () => {
    try {
      console.log('=== ADDING TEST USER ===')

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
          toast.error('User with this email already exists')
        } else {
          throw error
        }
      } else {
        console.log('Added user:', data)
        toast.success('Test user added successfully!')
        await runFullDebug()
      }

    } catch (error) {
      console.error('Add user error:', error)
      toast.error('Failed to add user: ' + error.message)
    }
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Search className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Registration Debug Tool
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Deep dive into the registration issue
              </p>
            </div>

            <div className="p-6">
              {/* Test Email Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="mb-6 flex flex-wrap gap-4">
                <button
                  onClick={runFullDebug}
                  disabled={debugging}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {debugging ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Debugging...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Run Full Debug
                    </>
                  )}
                </button>

                <button
                  onClick={fixEmailDirectly}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Fix Email Directly
                </button>

                <button
                  onClick={addTestUser}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Add Test User
                </button>
              </div>

              {/* Results */}
              {results && (
                <div className="space-y-6">
                  {/* Registration Check Result */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Registration Check Result
                    </h3>
                    <div className={`p-3 rounded-lg ${
                      results.registrationCheck?.success 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className="font-medium">
                        Email: {results.registrationCheck?.email}
                      </p>
                      <p className={`text-sm ${
                        results.registrationCheck?.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Status: {results.registrationCheck?.success ? '✅ WOULD SUCCEED' : '❌ WOULD FAIL'}
                      </p>
                      {results.registrationCheck?.error && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {results.registrationCheck.error}
                        </p>
                      )}
                      {results.registrationCheck?.allowedUser && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Found User:</p>
                          <pre className="text-xs bg-white p-2 rounded mt-1">
                            {JSON.stringify(results.registrationCheck.allowedUser, null, 2)}
                          </pre>
                        </div>
                      )}
                      {results.registrationCheck?.anyUser && !results.registrationCheck?.allowedUser && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-yellow-700">User exists but is_used=true:</p>
                          <pre className="text-xs bg-white p-2 rounded mt-1">
                            {JSON.stringify(results.registrationCheck.anyUser, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* All Allowed Users */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      All Allowed Users ({results.allAllowedUsers.length})
                    </h3>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {results.allAllowedUsers.map((user) => (
                        <div key={user.id} className={`p-3 rounded-lg border text-sm ${
                          user.email.includes('alen') ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-gray-600">{user.email}</p>
                              <p className="text-xs text-gray-400">
                                Used: {user.is_used ? 'Yes' : 'No'} | 
                                ID: {user.id.substring(0, 8)}...
                              </p>
                            </div>
                            {user.email.includes('alen') && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alen Search Results */}
                  {results.emailSearchResults.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Alen Search Results ({results.emailSearchResults.length})
                      </h3>
                      <div className="space-y-2">
                        {results.emailSearchResults.map((user) => (
                          <div key={user.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-400">
                              Used: {user.is_used ? 'Yes' : 'No'} | 
                              Created: {new Date(user.created_at).toLocaleDateString()}
                            </p>
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
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
