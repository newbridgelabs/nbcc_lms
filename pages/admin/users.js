import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { checkAdminAccess } from '../../lib/admin-config'
import { ArrowLeft, Users, Search, Trash2, Eye, Shield, User, Mail, Calendar, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, admin, member
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [viewUser, setViewUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    initializeAdmin()
  }, [])

  const initializeAdmin = async () => {
    const { isAdmin, user: currentUser } = await checkAdminAccess(router, setUser, setLoading)

    if (isAdmin && currentUser) {
      await loadUsers()
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          agreements(id, status, created_at),
          user_progress(id, completed)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    }
  }

  const getFilteredUsers = () => {
    let filtered = users

    // Filter by type
    if (filter === 'admin') {
      filtered = filtered.filter(user => user.is_admin === true || user.role === 'admin')
    } else if (filter === 'member') {
      filtered = filtered.filter(user => user.is_admin !== true && user.role !== 'admin')
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === user.id) {
      toast.error('You cannot delete your own account')
      return
    }

    try {
      console.log('Deleting user:', userId, userEmail)

      // First, reset the allowed_users entry so they can register again if needed
      try {
        const { error: allowedError } = await supabase
          .from('allowed_users')
          .update({
            is_used: false,
            registered_at: null
          })
          .eq('email', userEmail.toLowerCase())

        if (allowedError) {
          console.warn('Could not reset allowed_users entry:', allowedError.message)
        } else {
          console.log('Reset allowed_users entry for:', userEmail)
        }
      } catch (allowedResetError) {
        console.warn('Error resetting allowed_users:', allowedResetError.message)
      }

      // Delete from auth.users (this will cascade to other tables)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)

      if (authError) {
        // If auth deletion fails, try deleting from custom users table
        const { error: userError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)

        if (userError) throw userError
      }

      toast.success(`User ${userEmail} deleted successfully and can register again if needed`)
      await loadUsers()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user: ' + error.message)
    }
  }

  const getUserStats = (userData) => {
    const agreements = userData.agreements || []
    const progress = userData.user_progress || []
    
    return {
      hasAgreement: agreements.length > 0,
      agreementStatus: agreements[0]?.status || 'none',
      completedSections: progress.filter(p => p.completed).length,
      totalProgress: progress.length
    }
  }

  const getUserBadge = (userData) => {
    if (userData.is_admin === true || userData.role === 'admin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <User className="h-3 w-3 mr-1" />
        Member
      </span>
    )
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

  const filteredUsers = getFilteredUsers()

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold leading-7 text-gray-900">
                  User Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage church members and administrators
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters and Search */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              {/* Type Filter */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    filter === 'all'
                      ? 'bg-church-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Users ({users.length})
                </button>
                <button
                  onClick={() => setFilter('admin')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    filter === 'admin'
                      ? 'bg-church-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Admins ({users.filter(u => u.is_admin === true || u.role === 'admin').length})
                </button>
                <button
                  onClick={() => setFilter('member')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    filter === 'member'
                      ? 'bg-church-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Members ({users.filter(u => u.is_admin !== true && u.role !== 'admin').length})
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-church-primary focus:border-church-primary"
                />
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' 
                    ? 'No users have registered yet.'
                    : `No ${filter}s found.`
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agreement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((userData) => {
                      const stats = getUserStats(userData)
                      return (
                        <tr key={userData.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-church-primary flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {userData.full_name?.charAt(0) || userData.email?.charAt(0) || 'U'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {userData.full_name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {userData.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getUserBadge(userData)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {stats.hasAgreement ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                stats.agreementStatus === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {stats.agreementStatus}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stats.completedSections} sections
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(userData.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setViewUser(userData)}
                                className="text-church-primary hover:text-church-secondary"
                                title="View user details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {userData.id !== user.id && (
                                <button
                                  onClick={() => setDeleteConfirm(userData)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* User Detail Modal */}
        {viewUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <button
                    onClick={() => setViewUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm text-gray-900">{viewUser.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{viewUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <p className="text-sm text-gray-900">
                      {viewUser.is_admin ? 'Administrator' : 'Member'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Joined</label>
                    <p className="text-sm text-gray-900">
                      {new Date(viewUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Agreements</label>
                    <p className="text-sm text-gray-900">
                      {viewUser.agreements?.length || 0} submitted
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Progress</label>
                    <p className="text-sm text-gray-900">
                      {viewUser.user_progress?.filter(p => p.completed).length || 0} sections completed
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setViewUser(null)}
                    className="w-full px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">Delete User</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{deleteConfirm.full_name || deleteConfirm.email}</strong>? 
                    This action cannot be undone and will remove all their data including agreements and progress.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteUser(deleteConfirm.id, deleteConfirm.email)}
                      className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
