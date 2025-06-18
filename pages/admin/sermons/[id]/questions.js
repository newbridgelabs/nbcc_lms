import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../../components/Layout'
import { supabase, getCurrentUser } from '../../../../lib/supabase'
import { checkAdminStatus } from '../../../../lib/admin-config'
import { authenticatedFetch } from '../../../../lib/api-client'
import { 
  ArrowLeft, 
  MessageSquare, 
  Calendar, 
  User, 
  Book, 
  CheckCircle, 
  Clock,
  Send,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SermonQuestions() {
  const [user, setUser] = useState(null)
  const [sermon, setSermon] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [responses, setResponses] = useState({})
  const [updating, setUpdating] = useState({})
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
        router.push('/dashboard')
        return
      }
      setIsAdmin(true)

      await loadData()
    } catch (error) {
      console.error('Error checking access:', error)
      toast.error('Failed to verify access')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No auth token available')
      }

      // Load sermon details
      const sermonResponse = await authenticatedFetch(`/api/sermons/${id}`)
      const sermonData = await sermonResponse.json()
      
      if (!sermonResponse.ok) {
        throw new Error(sermonData.error || 'Failed to load sermon')
      }

      if (!sermonData.sermon) {
        toast.error('Sermon not found')
        router.push('/admin/sermons')
        return
      }
      setSermon(sermonData.sermon)

      // Load public questions with auth header
      const questionsResponse = await fetch(`/api/sermons/${id}/public-questions`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!questionsResponse.ok) {
        throw new Error('Failed to load questions')
      }

      const questionsData = await questionsResponse.json()
      console.log('Loaded questions:', questionsData)
      
      setQuestions(questionsData.questions || [])
      
      // Initialize responses state
      const initialResponses = {}
      questionsData.questions.forEach(q => {
        initialResponses[q.id] = q.admin_response || ''
      })
      setResponses(initialResponses)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load questions: ' + error.message)
    }
  }

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const updateQuestion = async (questionId, adminResponse, isAnswered = true) => {
    try {
      setUpdating(prev => ({ ...prev, [questionId]: true }))
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No auth token available')
      }

      const response = await fetch(`/api/sermons/${id}/public-questions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          question_id: questionId,
          admin_response: adminResponse,
          is_answered: isAnswered
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update question')
      }

      toast.success('Response saved successfully!')
      await loadData() // Reload to get updated data
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('Failed to save response: ' + error.message)
    } finally {
      setUpdating(prev => ({ ...prev, [questionId]: false }))
    }
  }

  const exportQuestions = () => {
    const csvContent = [
      ['Question', 'Admin Response', 'Status', 'Submitted Date'],
      ...questions.map(q => [
        `"${q.question_text.replace(/"/g, '""')}"`,
        `"${(q.admin_response || '').replace(/"/g, '""')}"`,
        q.is_answered ? 'Answered' : 'Pending',
        new Date(q.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sermon-questions-${sermon?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
                    Q&A: {sermon.title}
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
                  </div>
                </div>
              </div>
              
              {questions.length > 0 && (
                <button
                  onClick={exportQuestions}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Questions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {questions.length}
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
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Answered
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {questions.filter(q => q.is_answered).length}
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
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {questions.filter(q => !q.is_answered).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Questions from congregation members will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          question.is_answered
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {question.is_answered ? 'Answered' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(question.created_at)}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Question:</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                      {question.question_text}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-900">
                      Your Response:
                    </label>
                    <textarea
                      value={responses[question.id] || ''}
                      onChange={(e) => handleResponseChange(question.id, e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                      placeholder="Type your response to this question..."
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => updateQuestion(question.id, responses[question.id])}
                        disabled={updating[question.id]}
                        className="inline-flex items-center px-4 py-2 bg-church-primary text-white text-sm font-medium rounded-md hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50"
                      >
                        {updating[question.id] ? (
                          <>
                            <div className="loading-spinner w-4 h-4 mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Save Response
                          </>
                        )}
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
