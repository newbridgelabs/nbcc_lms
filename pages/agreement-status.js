import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { getCurrentUser } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { FileText, Clock, CheckCircle, Download, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AgreementStatus() {
  const [user, setUser] = useState(null)
  const [agreement, setAgreement] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadAgreementStatus()
  }, [])

  const loadAgreementStatus = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }

      setUser(currentUser)

      // Get user's agreement
      const { data: agreementData, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No agreement found, redirect to agreement form
          router.push('/agreement')
          return
        }
        throw error
      }

      setAgreement(agreementData)
    } catch (error) {
      console.error('Error loading agreement status:', error)
      toast.error('Failed to load agreement status')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!agreement?.pdf_url) {
      toast.error('PDF not available yet')
      return
    }

    try {
      // Open PDF in new tab
      window.open(agreement.pdf_url, '_blank')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF')
    }
  }

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    )
  }

  if (!agreement) {
    return (
      <Layout requireAuth>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">No agreement found</h2>
            <button
              onClick={() => router.push('/agreement')}
              className="mt-4 text-church-primary hover:text-church-secondary"
            >
              Submit your agreement
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const getStatusInfo = () => {
    switch (agreement.status) {
      case 'pending':
        return {
          icon: <Clock className="h-8 w-8 text-yellow-500" />,
          title: 'Agreement Under Review',
          description: 'Your membership agreement has been submitted and is currently being reviewed by church leadership.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 'completed':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Agreement Approved',
          description: 'Congratulations! Your membership agreement has been approved and signed by church leadership.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      default:
        return {
          icon: <FileText className="h-8 w-8 text-gray-500" />,
          title: 'Agreement Status Unknown',
          description: 'Please contact church administration for more information.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-church-primary mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Membership Agreement Status
                  </h1>
                  <p className="text-sm text-gray-500">
                    Track the status of your membership application
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Status Card */}
            <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-6`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {statusInfo.icon}
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {statusInfo.title}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {statusInfo.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Agreement Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Agreement Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Submitted Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(agreement.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {agreement.status}
                  </p>
                </div>
                
                {agreement.signed_at && (
                  <div>
                    <p className="text-sm text-gray-500">Approved Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(agreement.signed_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500">Applicant</p>
                  <p className="font-medium text-gray-900">
                    {agreement.form_data?.fullName || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Actions</h3>
              
              <div className="space-y-4">
                {agreement.status === 'completed' && agreement.pdf_url && (
                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center px-4 py-2 bg-church-primary text-white font-medium rounded-md hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Signed Agreement PDF
                  </button>
                )}
                
                {agreement.status === 'pending' && (
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">
                      <strong>What happens next?</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Church leadership will review your application</li>
                      <li>A pastor will sign your agreement</li>
                      <li>You'll receive a PDF copy via email</li>
                      <li>You'll be contacted about next steps</li>
                    </ul>
                  </div>
                )}
                
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">Need Help?</h3>
              <p className="text-blue-800 text-sm">
                If you have questions about your membership application or need to make changes, 
                please contact the church office or speak with a member of the pastoral team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
