import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { MessageSquare, Calendar, Play, CheckCircle, Clock } from 'lucide-react'

export default function SermonNotesWidget({ user }) {
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadRecentSermons()
    }
  }, [user])

  const loadRecentSermons = async () => {
    try {
      const response = await fetch('/api/sermons')
      const data = await response.json()

      if (response.ok) {
        // Get the 3 most recent sermons
        const recentSermons = (data.sermons || [])
          .sort((a, b) => new Date(b.sermon_date) - new Date(a.sermon_date))
          .slice(0, 3)
        setSermons(recentSermons)
      }
    } catch (error) {
      console.error('Error loading sermons:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (sermons.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MessageSquare className="h-5 w-5 text-church-primary mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Sermon Notes</h3>
        </div>
        <div className="text-center py-6">
          <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No sermons available yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 text-church-primary mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Sermons</h3>
        </div>
        <button
          onClick={() => router.push('/sermons')}
          className="text-sm text-church-primary hover:text-church-secondary font-medium"
        >
          View All
        </button>
      </div>

      <div className="space-y-4">
        {sermons.map((sermon) => (
          <div
            key={sermon.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-church-primary transition-colors duration-200 cursor-pointer"
            onClick={() => router.push(`/sermons/${sermon.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {sermon.title}
                </h4>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(sermon.sermon_date)}
                  {sermon.pastor_name && (
                    <>
                      <span className="mx-2">•</span>
                      {sermon.pastor_name}
                    </>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {sermon.sermon_questions?.length || 0} reflection points
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 bg-church-primary bg-opacity-10 rounded-full">
                  <Play className="h-4 w-4 text-church-primary" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => router.push('/sermons')}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary transition-colors duration-200"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Take Sermon Notes
        </button>
      </div>
    </div>
  )
}
