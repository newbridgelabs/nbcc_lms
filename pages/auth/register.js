import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import DatabaseSetupNotice from '../../components/DatabaseSetupNotice'
import { registerUser } from '../../lib/auth'
import { supabase, signOut } from '../../lib/supabase'
import { sendVerificationEmail } from '../../lib/supabase-email'
import { Eye, EyeOff, Mail, User, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const router = useRouter()

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      if (!validateForm()) {
        setLoading(false)
        return
      }

      // First check if user is allowed
      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', formData.email.toLowerCase())
        .single()

      if (allowedError || !allowedUser) {
        throw new Error('You must be invited to register. Please contact the church administrator.')
      }

      if (!allowedUser.is_allowed) {
        throw new Error('Your registration is pending approval. Please wait for an invitation email.')
      }

      // Register the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
            phone: ''
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        // Handle rate limit errors specifically
        if (error.message.includes('security purposes') || error.message.includes('too many requests')) {
          toast.error('Please wait a minute before trying again (security rate limit)')
          return
        }
        throw error
      }

      // Get user tag from allowed_users record
      const { data: allowedUserData, error: allowedUserError } = await supabase
        .from('allowed_users')
        .select('user_tag')
        .eq('email', formData.email.toLowerCase())
        .single()

      const userTag = allowedUserData?.user_tag || 'newcomer'

      // Create user record in users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: formData.email.toLowerCase(),
          full_name: formData.fullName,
          username: formData.username,
          is_admin: false,
          role: 'member',
          user_tag: userTag
        })

      if (userError) {
        console.error('Failed to create user record:', userError)
        // Don't throw here as the auth user is already created
      }

      // Update allowed_users record first before sending verification
      const { error: updateError } = await supabase
        .from('allowed_users')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          registered_at: new Date().toISOString()
        })
        .eq('email', formData.email.toLowerCase())

      if (updateError) {
        console.warn('Failed to update allowed_users record:', updateError)
      }

      // Show success message and redirect
      toast.success('Registration successful! Please check your email to verify your account.')
      router.push('/auth/check-email')

    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle different types of errors
      if (error.message.includes('security purposes') || error.message.includes('too many requests')) {
        toast.error('Please wait a minute before trying again (security rate limit)')
      } else if (error.message.includes('email address is already registered')) {
        toast.error('This email is already registered. Please try logging in instead.')
      } else {
        toast.error(error.message || 'Registration failed. Please try again.')
      }
      
      setErrors({ submit: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value.trim() // Trim whitespace from inputs
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div>
            <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-church-primary">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Complete your registration using the email you received an invitation for
            </p>
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Note:</strong> Registration is by invitation only. If you're visiting our church for the first time and would like to become a member, please contact our church administration to be added to the registration list.
              </p>
            </div>
          </div>

          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 sm:space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 sm:py-2 border ${
                      errors.fullName ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-400 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary focus:z-10 text-base sm:text-sm`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 sm:py-2 border ${
                      errors.username ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-400 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary focus:z-10 text-base sm:text-sm`}
                    placeholder="Choose a username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              {/* Email */}
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
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 sm:py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-400 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary focus:z-10 text-base sm:text-sm`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full pl-10 pr-10 py-3 sm:py-2 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-400 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary focus:z-10 text-base sm:text-sm`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full pl-10 pr-10 py-3 sm:py-2 border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-400 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary focus:z-10 text-base sm:text-sm`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent text-base sm:text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {loading ? (
                  <div className="loading-spinner w-5 h-5"></div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/auth/login')}
                  className="font-medium text-church-primary hover:text-church-secondary"
                >
                  Sign in here
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
