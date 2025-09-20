import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import SignaturePad from '../../../components/SignaturePad'
import { supabase } from '../../../lib/supabase'
import { checkAdminAccess } from '../../../lib/admin-config'
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendAgreementEmails } from '../../../utils/emailService'

export default function ReviewAgreement() {
  const [user, setUser] = useState(null)
  const [agreement, setAgreement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pastorSignature, setPastorSignature] = useState(null)
  const [processing, setProcessing] = useState(false)
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      initializeAdmin()
    }
  }, [id])



  const initializeAdmin = async () => {
    const { isAdmin, user: currentUser } = await checkAdminAccess(router, setUser, setLoading)

    if (isAdmin && currentUser) {
      await loadAgreement()
    }
  }

  const loadAgreement = async () => {
    try {
      const { data, error } = await supabase
        .from('agreements')
        .select('*, users(full_name, email)')
        .eq('id', id)
        .single()

      if (error) throw error

      setAgreement(data)

      // Load existing pastor signature if available
      if (data.pastor_signature) {
        setPastorSignature(data.pastor_signature)
      }
    } catch (error) {
      console.error('Error loading agreement:', error)
      toast.error('Failed to load agreement')
      router.push('/admin/agreements')
    }
  }

  const handleApprove = async () => {
    if (!pastorSignature) {
      toast.error('Please provide your signature before approving')
      return
    }

    setProcessing(true)

    try {
      console.log('Starting agreement approval process...')

      // Call the API endpoint to handle the approval process
      const response = await fetch('/api/admin/approve-agreement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agreementId: agreement.id,
          pastorSignature: pastorSignature
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve agreement')
      }

      console.log('Agreement approved successfully:', result)

      // Send emails using client-side EmailJS
      try {
        console.log('Sending emails via client-side EmailJS...')
        const userEmail = getFormValue('email')
        const userName = getFormValue('fullName') || getFormValue('name') || 'Member'

        await sendAgreementEmails(userEmail, userName, result.pdfUrl, agreement.id)
        console.log('✅ Emails sent successfully via client-side')
        toast.success('Agreement approved, PDF generated, and emails sent successfully!')
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError)
        toast.success('Agreement approved and PDF generated successfully! (Email notification failed)')
      }

      router.push('/admin/agreements')
    } catch (error) {
      console.error('Error approving agreement:', error)
      toast.error(`Failed to approve agreement: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }



  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    )
  }

  if (!agreement) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Agreement not found</h2>
            <button
              onClick={() => router.push('/admin/agreements')}
              className="mt-4 text-church-primary hover:text-church-secondary"
            >
              Back to agreements
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // Safely extract form data with fallbacks
  const formData = agreement?.form_data || {}

  // Helper function to safely get form data values
  const getFormValue = (key, fallback = 'Not provided') => {
    // First try the exact key as provided (camelCase from form)
    if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
      return formData[key]
    }

    // Try common variations of the key
    const possibleKeys = [
      key.toLowerCase(),
      key.replace(/([A-Z])/g, '_$1').toLowerCase(),
      key.replace(/([A-Z])/g, '-$1').toLowerCase(),
      // Common field name mappings
      key === 'fullName' ? 'name' : null,
      key === 'fullName' ? 'full_name' : null,
      key === 'emergencyContact' ? 'emergency_contact' : null,
      key === 'emergencyPhone' ? 'emergency_phone' : null,
      key === 'dateOfBirth' ? 'date_of_birth' : null,
      key === 'previousChurch' ? 'previous_church' : null
    ].filter(Boolean)

    for (const possibleKey of possibleKeys) {
      const value = formData[possibleKey]
      if (value !== null && value !== undefined && value !== '') {
        return value
      }
    }

    // Fallback to user data from the users table for basic info
    if (key === 'email' && agreement?.users?.email) {
      return agreement.users.email
    }
    if (key === 'fullName' && agreement?.users?.full_name) {
      return agreement.users.full_name
    }

    return fallback
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin/agreements')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold leading-7 text-gray-900">
                  Review Membership Consent
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {getFormValue('fullName') || getFormValue('name') || 'Unknown'} • Submitted {new Date(agreement.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                {agreement.status === 'completed' ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                ) : (
                  <div className="h-6 w-6 bg-yellow-500 rounded-full mr-3"></div>
                )}
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Status: {agreement.status === 'completed' ? 'Completed' : 'Pending Review'}
                  </h2>
                  {agreement.signed_at && (
                    <p className="text-sm text-gray-500">
                      Approved on {new Date(agreement.signed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>



            {/* Personal Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-900">{getFormValue('fullName') || getFormValue('name') || getFormValue('email')?.split('@')[0] || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{getFormValue('email')}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{getFormValue('phone')}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium text-gray-900">{getFormValue('dateOfBirth')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">{getFormValue('address')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Emergency Contact</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Contact Name</p>
                  <p className="font-medium text-gray-900">{getFormValue('emergencyContact')}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Contact Phone</p>
                  <p className="font-medium text-gray-900">{getFormValue('emergencyPhone')}</p>
                </div>
              </div>
            </div>

            {/* Church Background */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Church Background</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Previous Church</p>
                  <p className="font-medium text-gray-900">{getFormValue('previousChurch', 'Not specified')}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Baptized</p>
                  <p className="font-medium text-gray-900">{getFormValue('baptized', 'Not specified')}</p>
                </div>

                {getFormValue('testimony', null) && (
                  <div>
                    <p className="text-sm text-gray-500">Testimony</p>
                    <p className="font-medium text-gray-900">{getFormValue('testimony')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Signatures</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Signature */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Member Signature</h3>
                  {agreement.user_signature ? (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img 
                        src={agreement.user_signature} 
                        alt="User signature" 
                        className="max-w-full h-24 object-contain"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Signed on {new Date(agreement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No signature provided</p>
                  )}
                </div>

                {/* Pastor Signature */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Pastor Signature</h3>
                  {agreement.status === 'completed' && agreement.pastor_signature ? (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <img 
                        src={agreement.pastor_signature} 
                        alt="Pastor signature" 
                        className="max-w-full h-24 object-contain"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Signed on {new Date(agreement.signed_at).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <SignaturePad
                        onSignatureChange={setPastorSignature}
                        label="Pastor Signature"
                        required={true}
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Sign above to approve this membership agreement
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {agreement.status === 'pending' && (
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => router.push('/admin/agreements')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!pastorSignature || processing}
                  className="px-6 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <div className="flex items-center">
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Approve & Generate PDF'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
