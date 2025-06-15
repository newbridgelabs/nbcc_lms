import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { User, CheckCircle, XCircle, Mail, Key } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FixAlenRegistration() {
  const [loading, setLoading] = useState(false)
  const [alenData, setAlenData] = useState(null)
  const [fixing, setFixing] = useState(false)

  const alenEmail = 'alenps76@gmail.com'

  useEffect(() => {
    checkAlenStatus()
  }, [])

  const checkAlenStatus = async () => {
    setLoading(true)
    try {
      // Check if Alen exists in allowed_users
      const { data: allowedUser, error: allowedError } = await supabase
        .from('allowed_users')
        .select('*')
        .eq('email', alenEmail.toLowerCase())
        .single()

      // Check if Alen exists in users table
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', alenEmail.toLowerCase())
        .single()

      setAlenData({
        allowedUser: allowedUser || null,
        allowedError: allowedError?.message || null,
        userProfile: userProfile || null,
        userError: userError?.message || null,
        canRegister: allowedUser && !allowedUser.is_used,
        hasProfile: !!userProfile
      })

    } catch (error) {
      console.error('Error checking Alen status:', error)
      toast.error('Failed to check status')
    } finally {
      setLoading(false)
    }
  }

  const fixAlenRegistration = async () => {
    setFixing(true)
    try {
      let steps = []

      // Step 1: Ensure Alen is in allowed_users
      if (!alenData.allowedUser) {
        steps.push('Adding Alen to allowed_users...')
        const { data: newAllowedUser, error: insertError } = await supabase
          .from('allowed_users')
          .insert({
            email: alenEmail.toLowerCase(),
            full_name: 'Alen PS',
            invited_by: 'admin',
            invitation_sent_at: new Date().toISOString(),
            is_used: false,
            manual_verification: true
          })
          .select()
          .single()

        if (insertError) {
          throw new Error('Failed to add to allowed_users: ' + insertError.message)
        }
        steps.push('✅ Added to allowed_users')
      } else if (alenData.allowedUser.is_used) {
        // Reset the is_used flag
        steps.push('Resetting registration status...')
        const { error: updateError } = await supabase
          .from('allowed_users')
          .update({ 
            is_used: false,
            manual_verification: true,
            reset_at: new Date().toISOString()
          })
          .eq('email', alenEmail.toLowerCase())

        if (updateError) {
          throw new Error('Failed to reset status: ' + updateError.message)
        }
        steps.push('✅ Reset registration status')
      }

      // Step 2: Clean up any existing user profile if needed
      if (alenData.userProfile) {
        steps.push('Cleaning up existing profile...')
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('email', alenEmail.toLowerCase())

        if (deleteError) {
          console.warn('Could not delete existing profile:', deleteError.message)
          steps.push('⚠️ Could not clean existing profile (may need manual cleanup)')
        } else {
          steps.push('✅ Cleaned up existing profile')
        }
      }

      // Step 3: Test registration eligibility
      steps.push('Testing registration eligibility...')
      const { data: registrationCheck, error: regError } = await supabase.rpc('check_allowed_user', {
        user_email: alenEmail.toLowerCase()
      })

      if (regError) {
        throw new Error('Registration check failed: ' + regError.message)
      }

      if (registrationCheck && registrationCheck.length > 0) {
        steps.push('✅ Registration eligibility confirmed')
      } else {
        throw new Error('Registration check failed - user not eligible')
      }

      // Show success message
      toast.success('Alen\'s registration has been fixed! He can now register.')
      
      // Display steps
      steps.forEach(step => {
        console.log(step)
      })

      // Refresh status
      await checkAlenStatus()

    } catch (error) {
      console.error('Fix failed:', error)
      toast.error('Fix failed: ' + error.message)
    } finally {
      setFixing(false)
    }
  }

  const sendManualInstructions = () => {
    const instructions = `
Hi Alen,

Your registration has been fixed! Please follow these steps:

1. Go to: ${window.location.origin}/auth/register
2. Use email: ${alenEmail}
3. Create a password (at least 6 characters)
4. Fill in your full name: Alen PS
5. Choose a username
6. Click "Register"

You should be able to register successfully now. If you still have issues, please contact the admin.

Best regards,
NBCC Admin Team
    `.trim()

    navigator.clipboard.writeText(instructions).then(() => {
      toast.success('Instructions copied to clipboard! Send this to Alen.')
    }).catch(() => {
      toast.error('Could not copy to clipboard')
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Checking Alen's status...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center">
              <User className="h-6 w-6 mr-2 text-blue-600" />
              Fix Alen's Registration
            </h1>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Current Status for {alenEmail}</h2>
              
              {alenData && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-2">Allowed Users Status</h3>
                    <div className="flex items-center">
                      {alenData.allowedUser ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">
                        {alenData.allowedUser 
                          ? `In allowed list (Used: ${alenData.allowedUser.is_used ? 'Yes' : 'No'})`
                          : 'Not in allowed list'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-2">User Profile Status</h3>
                    <div className="flex items-center">
                      {alenData.hasProfile ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">
                        {alenData.hasProfile ? 'Has user profile' : 'No user profile'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-2">Registration Status</h3>
                    <div className="flex items-center">
                      {alenData.canRegister ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="text-sm">
                        {alenData.canRegister ? 'Can register' : 'Cannot register'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={fixAlenRegistration}
                disabled={fixing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {fixing ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Fixing Registration...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Fix Alen's Registration
                  </>
                )}
              </button>

              <button
                onClick={sendManualInstructions}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 flex items-center justify-center"
              >
                <Mail className="h-4 w-4 mr-2" />
                Copy Instructions for Alen
              </button>

              <button
                onClick={checkAlenStatus}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Refresh Status
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">What this fix does:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensures Alen is in the allowed_users list</li>
                <li>• Resets any "used" status to allow fresh registration</li>
                <li>• Cleans up any conflicting user profiles</li>
                <li>• Enables manual verification bypass</li>
                <li>• Tests registration eligibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
