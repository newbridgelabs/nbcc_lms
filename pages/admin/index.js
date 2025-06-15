import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { checkAdminAccess } from '../../lib/admin-config'
import { Upload, Users, FileText, BookOpen, CheckCircle, Clock, AlertCircle, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingAgreements: 0,
    completedAgreements: 0,
    totalSections: 0
  })
  const [pendingAgreements, setPendingAgreements] = useState([])
  const router = useRouter()

  useEffect(() => {
    initializeAdmin()
  }, [])

  const initializeAdmin = async () => {
    const { isAdmin, user: currentUser } = await checkAdminAccess(router, setUser, setLoading)

    if (isAdmin && currentUser) {
      await loadDashboardData()
    }
  }

  const loadDashboardData = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get agreements
      const { data: agreements, error: agreementsError } = await supabase
        .from('agreements')
        .select('*, users(full_name, email)')
        .order('created_at', { ascending: false })

      if (agreementsError) throw agreementsError

      // Get sections count
      const { count: sectionsCount } = await supabase
        .from('pdf_sections')
        .select('*', { count: 'exact', head: true })

      const pendingCount = agreements?.filter(a => a.status === 'pending').length || 0
      const completedCount = agreements?.filter(a => a.status === 'completed').length || 0

      setStats({
        totalUsers: userCount || 0,
        pendingAgreements: pendingCount,
        completedAgreements: completedCount,
        totalSections: sectionsCount || 0
      })

      setPendingAgreements(agreements?.filter(a => a.status === 'pending') || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-7 text-gray-900 truncate">
                  Admin Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage church membership system
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Agreements
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.pendingAgreements}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed Agreements
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.completedAgreements}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Study Sections
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalSections}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <button
              onClick={() => router.push('/admin/upload')}
              className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow min-h-[80px] sm:min-h-[100px]"
            >
              <div className="flex items-center">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-church-primary mr-3 sm:mr-4 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">Upload Study Materials</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Add new PDF sections</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/agreements')}
              className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow min-h-[80px] sm:min-h-[100px]"
            >
              <div className="flex items-center">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-church-primary mr-3 sm:mr-4 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">Review Agreements</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Sign and approve memberships</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/users')}
              className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow min-h-[80px] sm:min-h-[100px]"
            >
              <div className="flex items-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-church-primary mr-3 sm:mr-4 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">Manage Users</h3>
                  <p className="text-xs sm:text-sm text-gray-500">View user progress</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/user-status-check')}
              className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow min-h-[80px] sm:min-h-[100px]"
            >
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-church-primary mr-3 sm:mr-4 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">User Status Check</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Troubleshoot login issues</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/allowed-users')}
              className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow min-h-[80px] sm:min-h-[100px]"
            >
              <div className="flex items-center">
                <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-church-primary mr-3 sm:mr-4 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">Allowed Users</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Manage registration access</p>
                </div>
              </div>
            </button>


          </div>

          {/* Pending Agreements */}
          {pendingAgreements.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Pending Agreements ({pendingAgreements.length})
                </h3>
                <div className="space-y-4">
                  {pendingAgreements.slice(0, 5).map((agreement) => (
                    <div key={agreement.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {agreement.form_data?.fullName || 'Unknown'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {agreement.users?.email} • Submitted {new Date(agreement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/admin/agreements/${agreement.id}`)}
                        className="bg-church-primary text-white px-4 py-2 rounded-md text-sm hover:bg-church-secondary"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
                {pendingAgreements.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => router.push('/admin/agreements')}
                      className="text-church-primary hover:text-church-secondary text-sm font-medium"
                    >
                      View all {pendingAgreements.length} pending agreements →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
