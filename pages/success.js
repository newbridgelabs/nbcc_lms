import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { CheckCircle, Download, Mail, Home } from 'lucide-react'

export default function Success() {
  const [countdown, setCountdown] = useState(10)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Congratulations!
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Your membership agreement has been successfully submitted.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What happens next?
            </h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-church-primary mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Confirmation</p>
                  <p className="text-sm text-gray-600">
                    You'll receive a copy of your signed agreement via email within a few minutes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-church-primary mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Pastor Review</p>
                  <p className="text-sm text-gray-600">
                    Our pastor will review your application and contact you within 1-2 business days.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Home className="h-5 w-5 text-church-primary mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Welcome to the Family</p>
                  <p className="text-sm text-gray-600">
                    Once approved, you'll be officially welcomed as a member of our church family!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Please check your email (including spam folder) for your 
              agreement copy. If you don't receive it within 30 minutes, please contact the church office.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-church-primary hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
            >
              Return to Dashboard
            </button>
            
            <p className="text-sm text-gray-500">
              Automatically redirecting in {countdown} seconds...
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500">
              If you have any questions about your membership application, 
              please contact our church office or speak with one of our pastors.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
