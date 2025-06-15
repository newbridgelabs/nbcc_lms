import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { signInUser } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { checkAdminStatus } from '../../lib/admin-config'
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return false
    }

    if (!formData.password) {
      toast.error('Password is required')
      return false
    }

    return true
  }



  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { data, error } = await signInUser(formData.email, formData.password)

      if (error) {
        throw error
      }

      if (data?.user) {
        // Check if user has admin privileges
        const isAdmin = await checkAdminStatus(data.user.id, data.user.email)

        if (!isAdmin) {
          // Sign out the user if they're not an admin
          await supabase.auth.signOut()
          throw new Error(`Access denied. Admin privileges required. Contact administrator to add ${data.user.email} to admin list.`)
        }

        toast.success('Welcome back, Admin!')
        router.push('/admin')
      } else {
        throw new Error('Login completed but user data is missing')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => router.push('/auth/login')}
              className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to User Login
            </button>
            
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-church-primary">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Admin Sign In
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Access the church administration panel
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-church-primary focus:border-church-primary"
                    placeholder="admin@nbcc.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-church-primary focus:border-church-primary"
                    placeholder="Enter your password"
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
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In to Admin Panel'
                )}
              </button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an admin account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/admin/register')}
                  className="font-medium text-church-primary hover:text-church-secondary"
                >
                  Register here
                </button>
              </p>
              
              <p className="text-xs text-gray-500">
                Admin registration requires a special code from church leadership
              </p>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
