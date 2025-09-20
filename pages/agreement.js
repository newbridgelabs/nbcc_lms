import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import SignaturePad from '../components/SignaturePad'
import { getCurrentUser } from '../lib/supabase'
import { getUserProgress, getPDFSections } from '../lib/pdf-utils'
import { supabase } from '../lib/supabase'
import { FileText, User, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Agreement() {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
    emergencyPhone: '',
    previousChurch: '',
    baptized: '',
    testimony: '',
    commitment: false,
    agreement: false
  })
  const [userSignature, setUserSignature] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [canAccess, setCanAccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      setUser(currentUser)

      // Check if user already has a submitted consent
      const { data: existingAgreement, error: agreementError } = await supabase
        .from('agreements')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      if (existingAgreement) {
        // User already submitted consent, show status
        router.push('/agreement-status')
        return
      }

      // Pre-fill form with user data
      setFormData(prev => ({
        ...prev,
        fullName: currentUser.user_metadata?.full_name || '',
        email: currentUser.email || ''
      }))

      // Check if user has completed all sections
      const { sections } = await getPDFSections(supabase)
      const { progress } = await getUserProgress(currentUser.id, supabase)
      
      const totalSections = sections?.length || 0
      const completedSections = progress?.filter(p => p.completed).length || 0
      
      if (completedSections < totalSections) {
        setCanAccess(false)
        toast.error('Please complete all study sections before accessing the consent form')
        router.push('/dashboard')
        return
      }
      
      setCanAccess(true)
    } catch (error) {
      console.error('Error checking access:', error)
      toast.error('Failed to load consent form')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateForm = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'dateOfBirth', 'emergencyContact', 'emergencyPhone']
    const missing = required.filter(field => !formData[field])
    
    if (missing.length > 0) {
      toast.error(`Please fill in all required fields: ${missing.join(', ')}`)
      return false
    }
    
    if (!formData.commitment) {
      toast.error('Please confirm your commitment to the church')
      return false
    }
    
    if (!formData.agreement) {
      toast.error('Please provide your consent to the terms and conditions')
      return false
    }
    
    if (!userSignature) {
      toast.error('Please provide your signature')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    
    try {
      // Debug: Log form data before saving
      console.log('Submitting form data:', formData)

      // Save consent to database
      const { data, error } = await supabase
        .from('agreements')
        .insert({
          user_id: user.id,
          form_data: formData,
          user_signature: userSignature,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      toast.success('Consent form submitted successfully!')

      // Redirect to consent status page
      router.push('/agreement-status')
    } catch (error) {
      console.error('Error submitting consent form:', error)
      toast.error('Failed to submit consent form. Please try again.')
    } finally {
      setSubmitting(false)
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

  if (!canAccess) {
    return null // Will redirect
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-church-primary mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  NBCC Membership Consent
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Complete your membership by filling out this consent form
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 form-section">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary bg-white text-gray-900 text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary text-base sm:text-sm"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Emergency Contact
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                  />
                </div>
              </div>
            </div>

            {/* Spiritual Background */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Spiritual Background
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous Church (if any)
                  </label>
                  <input
                    type="text"
                    name="previousChurch"
                    value={formData.previousChurch}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have you been baptized?
                  </label>
                  <select
                    name="baptized"
                    value={formData.baptized}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                  >
                    <option value="">Please select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="planning">Planning to be baptized</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brief Testimony (Optional)
                  </label>
                  <textarea
                    name="testimony"
                    value={formData.testimony}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Share your faith journey or testimony..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                  />
                </div>
              </div>
            </div>

            {/* Commitments */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Membership Commitments
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="commitment"
                    checked={formData.commitment}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-church-primary focus:ring-church-primary border-gray-300 rounded"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    I commit to actively participate in the life of this church, including regular attendance, 
                    fellowship, service, and financial support as I am able. I understand the responsibilities 
                    and privileges of church membership as outlined in the study materials.
                  </label>
                </div>
                
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreement"
                    checked={formData.agreement}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-church-primary focus:ring-church-primary border-gray-300 rounded"
                  />
                  <label className="ml-3 text-sm text-gray-700">
                    I agree to the church's statement of faith, constitution, and bylaws. I understand
                    that this consent represents my voluntary decision to join this church community.
                  </label>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Digital Signature
              </h2>
              
              <SignaturePad
                onSignatureChange={setUserSignature}
                label="Your Signature"
                required={true}
              />
              
              <p className="mt-4 text-sm text-gray-600">
                By signing above, I confirm that all information provided is accurate and that I 
                voluntarily request membership in this church.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3 bg-church-primary text-white font-semibold rounded-lg hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors duration-200 text-base sm:text-sm"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner w-5 h-5 mr-2"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit Membership Agreement'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
