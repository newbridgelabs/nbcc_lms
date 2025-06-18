import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../../components/Layout'
import { getCurrentUser } from '../../../../lib/supabase'
import { checkAdminStatus } from '../../../../lib/admin-config'
import { authenticatedFetch } from '../../../../lib/api-client'
import {
  ArrowLeft,
  Calendar,
  User,
  Book,
  Edit,
  MessageSquare,
  Users,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../../../lib/supabase'

export default function AdminSermonView() {
  const [user, setUser] = useState(null)
  const [sermon, setSermon] = useState(null)
  const [questions, setQuestions] = useState([])
  const [stats, setStats] = useState({
    totalParticipants: 0,
    completedParticipants: 0,
    totalResponses: 0,
    publicQuestions: 0
  })
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      checkAccess()
    }
  }, [id])

  const checkAccess = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      setUser(currentUser)

      const adminStatus = await checkAdminStatus(currentUser.id, currentUser.email)
      if (!adminStatus) {
        toast.error('Admin access required')
        router.push('/dashboard')
        return
      }
      setIsAdmin(true)

      await loadData()
    } catch (error) {
      console.error('Error checking access:', error)
      toast.error('Failed to verify access')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      // Load sermon details
      const sermonResponse = await authenticatedFetch('/api/sermons')
      const sermonData = await sermonResponse.json()

      if (!sermonResponse.ok) {
        throw new Error(sermonData.error || 'Failed to load sermon')
      }

      const currentSermon = sermonData.sermons.find(s => s.id === id)
      if (!currentSermon) {
        toast.error('Sermon not found')
        router.push('/admin/sermons')
        return
      }
      setSermon(currentSermon)
      setQuestions(currentSermon.sermon_questions || [])

      // Load statistics
      await loadStats()
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load sermon data')
    }
  }

  const loadStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No auth token available')
      }

      const response = await fetch(`/api/sermons/${id}/stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load stats')
      }

      const { stats } = await response.json()
      setStats(stats)
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Failed to load participation stats')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  if (!isAdmin || !sermon) {
    return null
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <button
                  onClick={() => router.push('/admin/sermons')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    {sermon.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(sermon.sermon_date)}
                    </div>
                    {sermon.pastor_name && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {sermon.pastor_name}
                      </div>
                    )}
                    {sermon.scripture_reference && (
                      <div className="flex items-center">
                        <Book className="h-4 w-4 mr-1" />
                        {sermon.scripture_reference}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push(`/admin/sermons/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => router.push(`/admin/sermons/${id}/questions`)}
                  className="inline-flex items-center px-4 py-2 bg-church-primary text-white text-sm font-medium rounded-md hover:bg-church-secondary"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Q&A
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sermon Details */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Sermon Details
                </h2>
                {sermon.description && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-600">{sermon.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="ml-2 text-gray-600">{formatDate(sermon.sermon_date)}</span>
                  </div>
                  {sermon.pastor_name && (
                    <div>
                      <span className="font-medium text-gray-700">Pastor:</span>
                      <span className="ml-2 text-gray-600">{sermon.pastor_name}</span>
                    </div>
                  )}
                  {sermon.scripture_reference && (
                    <div>
                      <span className="font-medium text-gray-700">Scripture:</span>
                      <span className="ml-2 text-gray-600">{sermon.scripture_reference}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      sermon.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sermon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Questions ({questions.length})
                </h2>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-gray-500 mr-3">
                              Question {index + 1}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              question.is_private 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {question.is_private ? 'Private Notes' : 'Public Q&A'}
                            </span>
                          </div>
                          <p className="text-gray-900 mb-2">{question.question_text}</p>
                          {question.placeholder_text && (
                            <p className="text-sm text-gray-500 italic">
                              Placeholder: {question.placeholder_text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistics */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Participation Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Total Participants</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {stats.totalParticipants}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Completed</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {stats.completedParticipants}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Public Questions</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {stats.publicQuestions}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/sermons/${id}`)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                  >
                    View as User
                  </button>
                  <button
                    onClick={() => router.push(`/admin/sermons/${id}/questions`)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                  >
                    Manage Q&A
                  </button>
                  <button
                    onClick={() => router.push(`/admin/sermons/${id}/edit`)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                  >
                    Edit Sermon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
