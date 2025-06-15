import { useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FixAlenEmail() {
  const [fixing, setFixing] = useState(false)
  const [result, setResult] = useState(null)

  const fixEmailAddress = async () => {
    setFixing(true)
    setResult(null)

    try {
      console.log('Fixing Alen email address...')

      // First, check current data
      const { data: currentData, error: currentError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', 'alenpr76@gmail.com')
        .single()

      if (currentError || !currentData) {
        throw new Error('Could not find user with email alenpr76@gmail.com')
      }

      console.log('Current data:', currentData)

      // Update the email to the correct one
      const { data: updatedData, error: updateError } = await supabase
        .from('allowed_users')
        .update({
          email: 'alenps76@gmail.com'
        })
        .eq('id', currentData.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      console.log('Updated data:', updatedData)

      setResult({
        success: true,
        message: 'Email address updated successfully!',
        oldEmail: 'alenpr76@gmail.com',
        newEmail: 'alenps76@gmail.com',
        userData: updatedData
      })

      toast.success('Email address fixed! Alen can now register with alenps76@gmail.com')

    } catch (error) {
      console.error('Fix error:', error)
      setResult({
        success: false,
        message: error.message,
        error: error
      })
      toast.error('Failed to fix email address: ' + error.message)
    } finally {
      setFixing(false)
    }
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900">
                Fix Alen's Email Address
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Update the email from alenpr76@gmail.com to alenps76@gmail.com
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Issue:</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    The allowed users table has <code>alenpr76@gmail.com</code> but the user is trying to register with <code>alenps76@gmail.com</code>.
                    This is causing the "Registration is by invitation only" error.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <button
                  onClick={fixEmailAddress}
                  disabled={fixing}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {fixing ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Fixing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Fix Email Address
                    </>
                  )}
                </button>
              </div>

              {result && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900">Result:</h2>
                  
                  <div className={`p-4 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <p className={`text-sm font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.message}
                      </p>
                    </div>

                    {result.success && (
                      <div className="mt-3 text-sm text-green-700">
                        <p>✅ Changed from: <code>{result.oldEmail}</code></p>
                        <p>✅ Changed to: <code>{result.newEmail}</code></p>
                        <p className="mt-2 font-medium">
                          Alen can now register successfully with alenps76@gmail.com!
                        </p>
                      </div>
                    )}
                  </div>

                  {result.userData && (
                    <div className="mt-4">
                      <h3 className="text-md font-medium text-gray-900 mb-2">Updated User Data:</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(result.userData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Next Steps:</h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>1. ✅ Fix the email address (use the button above)</p>
                  <p>2. 🔄 Ask Alen to try registering again with alenps76@gmail.com</p>
                  <p>3. 📧 Check that the verification email is received</p>
                  <p>4. ✅ Complete the registration process</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
