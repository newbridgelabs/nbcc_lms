import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { checkAdminAccess } from '../../lib/admin-config'
import { Search, User, CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserStatusCheck() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [userStatus, setUserStatus] = useState(null)
  const [user, setUser] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    initializeAdmin()
  }, [])

  const initializeAdmin = async () => {
    const { isAdmin, user: currentUser } = await checkAdminAccess(router, setUser, setPageLoading)
    // If not admin, checkAdminAccess will redirect
  }

  const checkUserStatus = async (e) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    setLoading(true)
    setUserStatus(null)

    try {
      // Check if user is in allowed_users table
      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      // Check if user exists in auth.users (registered)
      const { data: authUsers, error: authError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()

      // Check if user exists in Supabase auth system using admin API
      let authUserExists = false
      try {
        const response = await fetch('/api/admin/check-auth-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.toLowerCase() })
        })

        const result = await response.json()
        authUserExists = result.exists || false
      } catch (error) {
        console.error('Error checking auth user:', error)
        // Fallback to the old method if API fails
        try {
          const { data: testSignIn } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password: 'test-password-that-will-fail'
          })
        } catch (testError) {
          authUserExists = testError.message?.includes('Invalid login credentials') ||
                          testError.message?.includes('Invalid email or password')
        }
      }

      const status = {
        email: email.toLowerCase(),
        inAllowedList: !!allowedUser,
        allowedUserData: allowedUser,
        isUsed: allowedUser?.is_used || false,
        hasProfile: !!authUsers,
        profileData: authUsers,
        authUserExists,
        registrationStatus: getRegistrationStatus(allowedUser, authUsers, authUserExists)
      }

      setUserStatus(status)

    } catch (error) {
      console.error('Error checking user status:', error)
      toast.error('Failed to check user status')
    } finally {
      setLoading(false)
    }
  }

  const getRegistrationStatus = (allowedUser, profileUser, authExists) => {
    if (!allowedUser) {
      return {
        status: 'not_invited',
        message: 'User is not in the allowed users list',
        action: 'Add user to allowed users list first',
        color: 'red'
      }
    }

    if (allowedUser && !allowedUser.is_used && !authExists) {
      return {
        status: 'invited_not_registered',
        message: 'User is invited but has not registered yet',
        action: 'User needs to visit the registration page and create an account',
        color: 'yellow'
      }
    }

    if (allowedUser && allowedUser.is_used && authExists && profileUser) {
      return {
        status: 'fully_registered',
        message: 'User is fully registered and can login',
        action: 'User can login normally',
        color: 'green'
      }
    }

    if (allowedUser && authExists && !profileUser) {
      return {
        status: 'partial_registration',
        message: 'User exists in auth but profile is incomplete',
        action: 'Contact technical support - profile sync issue',
        color: 'orange'
      }
    }

    return {
      status: 'unknown',
      message: 'Unknown status - needs investigation',
      action: 'Contact technical support',
      color: 'gray'
    }
  }

  const getStatusIcon = (status) => {
    switch (status.color) {
      case 'green':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'red':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'yellow':
      case 'orange':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBorderColor = (color) => {
    switch (color) {
      case 'green':
        return 'border-green-400'
      case 'red':
        return 'border-red-400'
      case 'yellow':
        return 'border-yellow-400'
      case 'orange':
        return 'border-orange-400'
      default:
        return 'border-gray-400'
    }
  }

  const getStatusBgColor = (color) => {
    switch (color) {
      case 'green':
        return 'bg-green-50'
      case 'red':
        return 'bg-red-50'
      case 'yellow':
        return 'bg-yellow-50'
      case 'orange':
        return 'bg-orange-50'
      default:
        return 'bg-gray-50'
    }
  }

  const getStatusTextColor = (color) => {
    switch (color) {
      case 'green':
        return 'text-green-800'
      case 'red':
        return 'text-red-800'
      case 'yellow':
        return 'text-yellow-800'
      case 'orange':
        return 'text-orange-800'
      default:
        return 'text-gray-800'
    }
  }

  if (pageLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Status Check</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Check the registration and login status of any user to help troubleshoot access issues.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <form onSubmit={checkUserStatus} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 sm:py-2 border border-gray-300 placeholder-gray-400 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary text-base sm:text-sm"
                  placeholder="Enter user's email address"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-transparent text-base sm:text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
            >
              {loading ? (
                <div className="loading-spinner w-4 h-4 mr-2"></div>
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Check Status
            </button>
          </form>
        </div>

        {userStatus && (
          <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 break-words">
              Status for {userStatus.email}
            </h2>

            <div className="space-y-4 sm:space-y-6">
              {/* Registration Status */}
              <div className={`p-4 rounded-md border-l-4 ${getStatusBorderColor(userStatus.registrationStatus.color)} ${getStatusBgColor(userStatus.registrationStatus.color)}`}>
                <div className="flex items-center">
                  {getStatusIcon(userStatus.registrationStatus)}
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${getStatusTextColor(userStatus.registrationStatus.color)}`}>
                      {userStatus.registrationStatus.message}
                    </h3>
                    <p className={`text-sm ${getStatusTextColor(userStatus.registrationStatus.color)} mt-1`}>
                      <strong>Action needed:</strong> {userStatus.registrationStatus.action}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gray-50 p-4 sm:p-5 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Invitation Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-700 font-medium">In allowed users list:</span>
                      <span className={userStatus.inAllowedList ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {userStatus.inAllowedList ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {userStatus.inAllowedList && (
                      <>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-700 font-medium">Invitation used:</span>
                          <span className={userStatus.isUsed ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                            {userStatus.isUsed ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {userStatus.allowedUserData?.invitation_sent_at && (
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                            <span className="text-gray-700 font-medium">Invited on:</span>
                            <span className="text-gray-800 font-medium">
                              {new Date(userStatus.allowedUserData.invitation_sent_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 sm:p-5 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Registration Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-700 font-medium">Has user profile:</span>
                      <span className={userStatus.hasProfile ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {userStatus.hasProfile ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-700 font-medium">Can login:</span>
                      <span className={userStatus.authUserExists ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {userStatus.authUserExists ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-900 mb-2">Instructions for User</h4>
                <div className="text-sm text-blue-800">
                  {userStatus.registrationStatus.status === 'not_invited' && (
                    <p>This user needs to be added to the allowed users list first. Go to the "Allowed Users" page and add their email address.</p>
                  )}
                  {userStatus.registrationStatus.status === 'invited_not_registered' && (
                    <p>Tell the user to visit the registration page and create an account using the email address: <strong>{userStatus.email}</strong></p>
                  )}
                  {userStatus.registrationStatus.status === 'fully_registered' && (
                    <p>User can login normally at the login page. If they're having trouble, they may need to reset their password.</p>
                  )}
                  {userStatus.registrationStatus.status === 'partial_registration' && (
                    <p>There's a technical issue with this user's profile. Contact technical support.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
