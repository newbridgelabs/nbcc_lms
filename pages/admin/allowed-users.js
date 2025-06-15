import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { checkAdminAccess } from '../../lib/admin-config'
import { sendHybridEmail } from '../../lib/supabase-email'
import { ArrowLeft, Users, Plus, Mail, Trash2, Eye, UserPlus, Send, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AllowedUsersManagement() {
  const [user, setUser] = useState(null)
  const [allowedUsers, setAllowedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    fullName: ''
  })
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    initializeAdmin()
  }, [])

  const initializeAdmin = async () => {
    const { isAdmin, user: currentUser } = await checkAdminAccess(router, setUser, setLoading)

    if (isAdmin && currentUser) {
      await loadAllowedUsers()
    }
  }

  const loadAllowedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('allowed_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllowedUsers(data || [])
    } catch (error) {
      console.error('Error loading allowed users:', error)
      toast.error('Failed to load allowed users')
    }
  }

  // Removed temp password generation - using invitation-only registration instead

  const handleAddUser = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.fullName) {
      toast.error('Please fill in all fields')
      return
    }

    setProcessing(true)

    try {
      // Add user to allowed_users table
      const { data, error } = await supabase
        .from('allowed_users')
        .insert({
          email: formData.email.toLowerCase(),
          full_name: formData.fullName,
          invited_by: user.id,
          invitation_sent_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('This email is already in the allowed users list')
        }
        throw error
      }

      // Send invitation email
      const emailResult = await sendHybridEmail({
        to_email: formData.email,
        to_name: formData.fullName,
        subject: 'Welcome to New Bridge Community Church - Complete Your Registration',
        message: `Dear ${formData.fullName},

You have been invited to join the New Bridge Community Church family!

To complete your membership registration, please visit our website and create your account using this email address.

Registration Link: ${window.location.origin}/auth/register

We look forward to welcoming you to our church community.

Blessings,
NBCC Admin Team`
      }, 'invitation')

      if (emailResult.success) {
        toast.success('User added and invitation email sent successfully!')
      } else {
        toast.success('User added successfully, but email sending failed. Please share credentials manually.')
        console.warn('Email sending failed:', emailResult.error)
      }

      // Reset form and reload data
      setFormData({ email: '', fullName: '' })
      setShowAddForm(false)
      await loadAllowedUsers()

    } catch (error) {
      console.error('Error adding user:', error)
      toast.error(error.message || 'Failed to add user')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`Are you sure you want to remove ${email} from the allowed users list?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('allowed_users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      toast.success('User removed successfully')
      await loadAllowedUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to remove user')
    }
  }

  const handleEditUser = async (userId, currentEmail, currentName) => {
    const newEmail = prompt('Enter correct email address:', currentEmail)
    if (!newEmail || newEmail === currentEmail) return

    const newName = prompt('Enter correct full name:', currentName)
    if (!newName || newName === currentName) return

    try {
      const { error } = await supabase
        .from('allowed_users')
        .update({
          email: newEmail.toLowerCase(),
          full_name: newName
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('User information updated successfully')
      await loadAllowedUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user information')
    }
  }

  const handleResendInvitation = async (allowedUser) => {
    setProcessing(true)

    try {
      const emailResult = await sendHybridEmail({
        to_email: allowedUser.email,
        to_name: allowedUser.full_name,
        subject: 'Welcome to New Bridge Community Church - Complete Your Registration',
        message: `Dear ${allowedUser.full_name},

You have been invited to join the New Bridge Community Church family!

To complete your membership registration, please visit our website and create your account using this email address.

Registration Link: ${window.location.origin}/auth/register

We look forward to welcoming you to our church community.

Blessings,
NBCC Admin Team`
      }, 'invitation')

      if (emailResult.success) {
        // Update invitation_sent_at timestamp
        await supabase
          .from('allowed_users')
          .update({ invitation_sent_at: new Date().toISOString() })
          .eq('id', allowedUser.id)

        toast.success('Invitation email resent successfully!')
        await loadAllowedUsers()
      } else {
        toast.error('Failed to send invitation email: ' + emailResult.error)
      }
    } catch (error) {
      console.error('Error resending invitation:', error)
      toast.error('Failed to resend invitation')
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/admin')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold leading-7 text-gray-900">
                    Allowed Users Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage who can register for church membership
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Add User Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Add New Allowed User
                  </h3>
                  <form onSubmit={handleAddUser}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false)
                          setFormData({ email: '', fullName: '' })
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-church-primary hover:bg-church-secondary rounded-md disabled:opacity-50"
                      >
                        {processing ? 'Adding...' : 'Add & Send Invitation'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Allowed Users ({allowedUsers.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Users who are allowed to register for church membership
              </p>
            </div>
            
            {allowedUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No allowed users</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding the first allowed user.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {allowedUsers.map((allowedUser) => (
                  <li key={allowedUser.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {allowedUser.full_name}
                            </p>
                            {allowedUser.is_used && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Registered
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{allowedUser.email}</p>
                          <p className="text-xs text-gray-400">
                            Added: {new Date(allowedUser.created_at).toLocaleDateString()}
                            {allowedUser.invitation_sent_at && (
                              <span className="ml-2">
                                • Invited: {new Date(allowedUser.invitation_sent_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditUser(allowedUser.id, allowedUser.email, allowedUser.full_name)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit user information"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {!allowedUser.is_used && (
                          <button
                            onClick={() => handleResendInvitation(allowedUser)}
                            disabled={processing}
                            className="text-church-primary hover:text-church-secondary disabled:opacity-50"
                            title="Resend invitation"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(allowedUser.id, allowedUser.email)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
