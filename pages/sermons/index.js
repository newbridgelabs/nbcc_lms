import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { getCurrentUser } from '../../lib/supabase'
import { Calendar, User, Book, Play, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SermonsList() {
  const [user, setUser] = useState(null)
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      setUser(currentUser)
      await loadSermons()
    } catch (error) {
      console.error('Error checking user:', error)
      toast.error('Failed to load sermons')
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

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Interactive Sermon Notes
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Take notes, reflect, and engage with our sermons
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {sermons.length === 0 ? (
            <div className="text-center py-12">
              <Book className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sermons available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Check back soon for new interactive sermon notes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sermons.map((sermon) => (
                <div key={sermon.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">
                          {formatDate(sermon.sermon_date)}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-church-primary bg-opacity-10 text-church-primary">
                        Interactive
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-3 line-clamp-2">
                      {sermon.title}
                    </h3>
                    
                    {sermon.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {sermon.description}
                      </p>
                    )}
                    
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
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-sm text-gray-500">
                        {sermon.sermon_questions?.length || 0} reflection points
                      </div>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/sermons/${sermon.id}`)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-church-primary text-white text-sm font-medium rounded-md hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary transition-colors duration-200"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Taking Notes
                    </button>
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
