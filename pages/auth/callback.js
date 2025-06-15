import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthCallback() {
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase not configured')
        }

        // Get the hash fragment from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (type === 'signup' && accessToken) {
          // Email verification successful
          setStatus('success')
          setMessage('Email verified successfully! You can now sign in.')
          toast.success('Email verified successfully!')

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        } else if (type === 'recovery' && accessToken) {
          // Password reset
          setStatus('success')
          setMessage('You can now reset your password.')
          router.push('/auth/reset-password')
        } else {
          // Check if user is already authenticated (Google OAuth or other)
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            setStatus('success')
            setMessage('Sign in successful! Redirecting to dashboard...')
            toast.success('Welcome!')
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          } else {
            throw new Error('Invalid verification link or link has expired')
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Verification failed. Please try again.')
        toast.error('Verification failed')
      }
    }

    handleAuthCallback()
  }, [router])

  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-church-primary" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying your email...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your email address.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  if (status === 'success') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verification Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-church-primary hover:bg-church-secondary text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verification Failed
          </h2>
          <p className="text-gray-600 mb-4">
            {message}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/auth/register')}
              className="bg-church-primary hover:bg-church-secondary text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md text-sm font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
