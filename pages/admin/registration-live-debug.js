import { useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { registerUser } from '../../lib/auth'
import { Bug, Play, Database, User, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegistrationLiveDebug() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState(null)
  const [testData, setTestData] = useState({
    email: 'alenps76@gmail.com',
    password: 'TestPassword123!',
    fullName: 'Alen Pradeep',
    username: 'alen_test'
  })

  const runLiveRegistrationTest = async () => {
    setTesting(true)
    setResults(null)

    const debug = {
      steps: [],
      finalResult: null,
      error: null
    }

    try {
      console.log('=== LIVE REGISTRATION DEBUG ===')
      
      // Step 1: Check if email exists in allowed_users
      debug.steps.push({ step: 1, name: 'Checking allowed_users table', status: 'running' })
      
      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', testData.email.toLowerCase())
        .eq('is_used', false)
        .single()

      if (allowedError || !allowedUser) {
        debug.steps[0].status = 'failed'
        debug.steps[0].error = allowedError?.message || 'User not found or already used'
        debug.steps[0].details = { allowedError, allowedUser }
        
        // Also check if user exists but is marked as used
        const { data: anyUser, error: anyError } = await supabase
          .from('allowed_users')
          .select('*')
          .eq('email', testData.email.toLowerCase())
          .single()
        
        debug.steps[0].anyUser = anyUser
        debug.steps[0].anyError = anyError?.message
      } else {
        debug.steps[0].status = 'success'
        debug.steps[0].details = allowedUser
      }

      // Step 2: Check if user already exists in auth
      debug.steps.push({ step: 2, name: 'Checking if user exists in auth', status: 'running' })
      
      try {
        const { data: existingUser, error: existingError } = await supabase
          .from('users')
          .select('*')
          .eq('email', testData.email.toLowerCase())
          .single()

        if (existingUser) {
          debug.steps[1].status = 'failed'
          debug.steps[1].error = 'User already exists in users table'
          debug.steps[1].details = existingUser
        } else {
          debug.steps[1].status = 'success'
          debug.steps[1].details = 'No existing user found'
        }
      } catch (error) {
        debug.steps[1].status = 'success'
        debug.steps[1].details = 'No existing user found (expected)'
      }

      // Step 3: Try actual registration if allowed_user check passed
      if (debug.steps[0].status === 'success') {
        debug.steps.push({ step: 3, name: 'Attempting registration', status: 'running' })
        
        try {
          const registrationResult = await registerUser(
            testData.email,
            testData.password,
            testData.fullName,
            testData.username
          )

          if (registrationResult.error) {
            debug.steps[2].status = 'failed'
            debug.steps[2].error = registrationResult.error.message
            debug.steps[2].details = registrationResult
          } else {
            debug.steps[2].status = 'success'
            debug.steps[2].details = registrationResult
            
            // Clean up - delete the test user we just created
            if (registrationResult.data?.user?.id) {
              try {
                await supabase.auth.admin.deleteUser(registrationResult.data.user.id)
                console.log('Cleaned up test user')
              } catch (cleanupError) {
                console.warn('Could not clean up test user:', cleanupError)
              }
            }
          }
        } catch (regError) {
          debug.steps[2].status = 'failed'
          debug.steps[2].error = regError.message
          debug.steps[2].details = regError
        }
      } else {
        debug.steps.push({ 
          step: 3, 
          name: 'Registration skipped', 
          status: 'skipped',
          reason: 'allowed_users check failed'
        })
      }

      // Step 4: Check current state of allowed_users after test
      debug.steps.push({ step: 4, name: 'Final allowed_users state', status: 'running' })
      
      const { data: finalState, error: finalError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', testData.email.toLowerCase())
        .single()

      debug.steps[3].status = 'success'
      debug.steps[3].details = { finalState, finalError: finalError?.message }

      setResults(debug)

    } catch (error) {
      console.error('Debug error:', error)
      debug.error = error.message
      setResults(debug)
    } finally {
      setTesting(false)
    }
  }

  const fixAllowedUser = async () => {
    try {
      console.log('Fixing allowed user...')

      // Delete any existing entries for this email
      await supabase
        .from('allowed_users')
        .delete()
        .eq('email', testData.email.toLowerCase())

      // Add fresh entry
      const { data, error } = await supabase
        .from('allowed_users')
        .insert({
          email: testData.email.toLowerCase(),
          full_name: testData.fullName,
          is_used: false
        })
        .select()

      if (error) throw error

      toast.success('Fresh allowed_users entry created!')
      console.log('Created fresh entry:', data)

    } catch (error) {
      console.error('Fix error:', error)
      toast.error('Fix failed: ' + error.message)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅'
      case 'failed': return '❌'
      case 'running': return '🔄'
      case 'skipped': return '⏭️'
      default: return '❓'
    }
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Bug className="h-6 w-6 text-red-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Live Registration Debug
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Step-by-step registration process debugging
              </p>
            </div>

            <div className="p-6">
              {/* Test Data */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Test Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={testData.email}
                      onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={testData.fullName}
                      onChange={(e) => setTestData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={testData.password}
                      onChange={(e) => setTestData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={testData.username}
                      onChange={(e) => setTestData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mb-6 flex flex-wrap gap-4">
                <button
                  onClick={runLiveRegistrationTest}
                  disabled={testing}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {testing ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Live Registration Test
                    </>
                  )}
                </button>

                <button
                  onClick={fixAllowedUser}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Fix Allowed User Entry
                </button>
              </div>

              {/* Results */}
              {results && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900">Debug Results</h2>
                  
                  {/* Steps */}
                  <div className="space-y-4">
                    {results.steps.map((step) => (
                      <div key={step.step} className={`p-4 rounded-lg border ${
                        step.status === 'success' ? 'bg-green-50 border-green-200' :
                        step.status === 'failed' ? 'bg-red-50 border-red-200' :
                        step.status === 'running' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">
                            {getStatusIcon(step.status)} Step {step.step}: {step.name}
                          </h3>
                          <span className={`text-sm px-2 py-1 rounded ${
                            step.status === 'success' ? 'bg-green-100 text-green-800' :
                            step.status === 'failed' ? 'bg-red-100 text-red-800' :
                            step.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        
                        {step.error && (
                          <p className="text-sm text-red-600 mb-2">
                            <strong>Error:</strong> {step.error}
                          </p>
                        )}
                        
                        {step.reason && (
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Reason:</strong> {step.reason}
                          </p>
                        )}

                        {step.anyUser && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-yellow-700">User exists but is marked as used:</p>
                            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(step.anyUser, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {step.details && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer">View Details</summary>
                            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(step.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Overall Error */}
                  {results.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-800 mb-2">Overall Error:</h3>
                      <p className="text-sm text-red-700">{results.error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">What This Tool Does</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                    <li>Checks if the email exists in allowed_users table with is_used=false</li>
                    <li>Checks if the user already exists in the auth system</li>
                    <li>Attempts the actual registration process</li>
                    <li>Shows the final state of the allowed_users entry</li>
                    <li>Cleans up any test user created during the process</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
