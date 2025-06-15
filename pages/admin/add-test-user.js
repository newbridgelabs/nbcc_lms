import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, UserPlus, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AddTestUser() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const addTestUser = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('allowed_users')
        .insert([
          {
            email: email.toLowerCase(),
            full_name: fullName,
            temp_password: 'temp123'
          }
        ])
        .select()

      if (error) throw error

      setSuccess(true)
      toast.success('Test user added successfully!')
      console.log('Added user:', data)

    } catch (error) {
      console.error('Error adding test user:', error)
      toast.error('Failed to add test user: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold leading-7 text-gray-900">
                  Add Test User
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Add a user to the allowed list for testing registration
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              {success ? (
                <div className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Test User Added Successfully!
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    You can now test registration with email: <strong>{email}</strong>
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/auth/register')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary"
                    >
                      Test Registration
                    </button>
                    <br />
                    <button
                      onClick={() => router.push('/admin/allowed-users')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View Allowed Users
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={addTestUser}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-church-primary focus:border-church-primary"
                        placeholder="test@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-church-primary focus:border-church-primary"
                        placeholder="Test User"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="loading-spinner w-5 h-5 mr-2"></div>
                            Adding User...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-5 w-5 mr-2" />
                            Add Test User
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="mt-8 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Testing Instructions:</h4>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Add a test user with your email address</li>
                  <li>Go to registration page and register with that email</li>
                  <li>Complete the study sections and agreement</li>
                  <li>As admin, approve the agreement to test email sending</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
