import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { getCurrentUser } from '../../lib/supabase'
import { checkAdminStatus } from '../../lib/admin-config'
import { Plus, Edit, Eye, MessageSquare, Calendar, User, Book } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSermons() {
  const [user, setUser] = useState(null)
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [])

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
        router.push('/dashboard')
        return
      }
      setIsAdmin(true)

      await loadSermons()
    } catch (error) {
      console.error('Error checking access:', error)
      toast.error('Failed to verify access')
    } finally {
      setLoading(false)
    }
  }

  const loadSermons = async () => {
    try {
      const response = await fetch('/api/sermons')
      const data = await response.json()

      if (response.ok) {
        setSermons(data.sermons || [])
      } else {
        throw new Error(data.error || 'Failed to load sermons')
      }
    } catch (error) {
      console.error('Error loading sermons:', error)
      toast.error('Failed to load sermons')
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

  if (!isAdmin) {
    return null
  }

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Sermon Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Create and manage interactive sermon notes and Q&A sessions
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/sermons/create')}
                className="inline-flex items-center px-4 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary min-h-[44px] transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Sermon
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {sermons.length === 0 ? (
            <div className="text-center py-12">
              <Book className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sermons</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first interactive sermon.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/admin/sermons/create')}
                  className="inline-flex items-center px-4 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Sermon
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sermons.map((sermon) => (
                <div key={sermon.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">
                          {formatDate(sermon.sermon_date)}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                      {sermon.title}
                    </h3>
                    
                    {sermon.pastor_name && (
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{sermon.pastor_name}</span>
                      </div>
                    )}
                    
                    {sermon.scripture_reference && (
                      <div className="flex items-center mb-4">
                        <Book className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{sermon.scripture_reference}</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-500 mb-4">
                      {sermon.sermon_questions?.length || 0} questions
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/admin/sermons/${sermon.id}/edit`)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => router.push(`/admin/sermons/${sermon.id}/questions`)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Q&A
                      </button>
                      
                      <button
                        onClick={() => router.push(`/admin/sermons/${sermon.id}/view`)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-church-primary text-white text-sm font-medium rounded-md hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
