import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CheckEmail() {
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get email from query params
    if (router.query.email) {
      setEmail(router.query.email)
    }
  }, [router.query])

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email address not found')
      return
    }

    setResending(true)
    try {
      console.log('Resending verification email to:', email)

      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      // Resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Resend error:', error)
        throw error
      }

      toast.success('Verification email sent! Please check your inbox and spam folder.')
    } catch (error) {
      console.error('Failed to resend email:', error)
      toast.error(error.message || 'Failed to resend email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-church-primary">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a verification link to{' '}
              <span className="font-medium text-church-primary">{email}</span>
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  What's next?
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-church-primary text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      1
                    </div>
                    <p className="text-left">Check your email inbox (and spam folder)</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-church-primary text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      2
                    </div>
                    <p className="text-left">Click the "Confirm your email" link in the email</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-church-primary text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      3
                    </div>
                    <p className="text-left">You'll be redirected back to sign in</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Didn't receive the email?
                  </p>
                  <button
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50"
                  >
                    {resending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    {resending ? 'Sending...' : 'Resend email'}
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-church-primary hover:text-church-secondary"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
