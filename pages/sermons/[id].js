import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase, getCurrentUser } from '../../lib/supabase'
import { authenticatedFetch } from '../../lib/api-client'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Calendar,
  User,
  Book,
  MessageSquare,
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SermonNotes() {
  const [user, setUser] = useState(null)
  const [sermon, setSermon] = useState(null)
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPublicQuestion, setShowPublicQuestion] = useState(false)
  const [publicQuestion, setPublicQuestion] = useState('')
  const [submittingQuestion, setSubmittingQuestion] = useState(false)
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      checkAuthAndLoadData()
    }
  }, [id])

  // Set up auth state listener
  useEffect(() => {
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null)
        if (id) loadSermonData(session?.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/auth/login')
      }
    })

    return () => subscription?.unsubscribe()
  }, [id])

  const checkAuthAndLoadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      setUser(currentUser)
      await loadSermonData(currentUser)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
    }
  }

  const loadSermonData = async (currentUser) => {
    if (!currentUser) return

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Load sermon and questions
      const sermonResponse = await fetch('/api/sermons', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const sermonData = await sermonResponse.json()
      
      if (!sermonResponse.ok) {
        throw new Error(sermonData.error || 'Failed to load sermon')
      }

      const currentSermon = sermonData.sermons.find(s => s.id === id)
      if (!currentSermon) {
        toast.error('Sermon not found')
        router.push('/sermons')
        return
      }

      setSermon(currentSermon)
      setQuestions(currentSermon.sermon_questions || [])

      // Load user responses
      const responsesResponse = await fetch(`/api/sermons/${id}/responses`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const responsesData = await responsesResponse.json()
      
      if (responsesResponse.ok) {
        const responseMap = {}
        responsesData.responses.forEach(response => {
          responseMap[response.question_id] = response.response_text || ''
        })
        setResponses(responseMap)
      }

      // Load participation status
      const participationResponse = await fetch(`/api/sermons/${id}/participation`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const participationData = await participationResponse.json()
      
      if (participationResponse.ok && participationData.participation) {
        setCurrentQuestionIndex(participationData.participation.current_question_index || 0)
      }

    } catch (error) {
      console.error('Error loading sermon data:', error)
      toast.error('Failed to load sermon')
    } finally {
      setLoading(false)
    }
  }

  const saveResponse = async (questionId, responseText) => {
    try {
      setSaving(true)
      
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`/api/sermons/${id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          question_id: questionId,
          response_text: responseText
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save response')
      }

      // Update participation
      await fetch(`/api/sermons/${id}/participation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          current_question_index: currentQuestionIndex
        })
      })

      toast.success('Response saved successfully')

    } catch (error) {
      console.error('Error saving response:', error)
      toast.error('Failed to save response')
    } finally {
      setSaving(false)
    }
  }

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (currentQuestion) {
      await saveResponse(currentQuestion.id, responses[currentQuestion.id] || '')
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setShowPublicQuestion(true)
    }
  }

  const handlePrevious = () => {
    if (showPublicQuestion) {
      setShowPublicQuestion(false)
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const submitPublicQuestion = async () => {
    if (!publicQuestion.trim()) {
      toast.error('Please enter a question')
      return
    }

    try {
      setSubmittingQuestion(true)
      const response = await authenticatedFetch(`/api/sermons/${id}/public-questions`, {
        method: 'POST',
        body: JSON.stringify({
          question_text: publicQuestion.trim()
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit question')
      }

      toast.success('Question submitted successfully!')
      setPublicQuestion('')

      // Mark as completed
      await authenticatedFetch(`/api/sermons/${id}/participation`, {
        method: 'POST',
        body: JSON.stringify({
          completed: true
        })
      })

      router.push('/sermons')
    } catch (error) {
      console.error('Error submitting question:', error)
      toast.error('Failed to submit question')
    } finally {
      setSubmittingQuestion(false)
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

  if (!sermon) {
    return (
      <Layout requireAuth>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sermon Not Found</h1>
            <button
              onClick={() => router.push('/sermons')}
              className="px-4 py-2 bg-church-primary text-white rounded hover:bg-church-secondary"
            >
              Back to Sermons
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + (showPublicQuestion ? 1 : 0)) / (questions.length + 1)) * 100

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <button
                  onClick={() => router.push('/sermons')}
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
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-church-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {showPublicQuestion ? (
            /* Public Question Section */
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <MessageSquare className="mx-auto h-12 w-12 text-church-primary mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Questions for the Pastor
                </h2>
                <p className="text-gray-600">
                  Do you have any questions about today's sermon? Ask freely - your questions will be answered in next week's session.
                </p>
              </div>
              
              <div className="space-y-4">
                <textarea
                  value={publicQuestion}
                  onChange={(e) => setPublicQuestion(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                  placeholder="Type your question here... (This will be shared anonymously with the pastor)"
                />
                
                <div className="flex justify-between">
                  <button
                    onClick={handlePrevious}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </button>
                  
                  <div className="space-x-3">
                    <button
                      onClick={() => router.push('/sermons')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Skip & Finish
                    </button>
                    <button
                      onClick={submitPublicQuestion}
                      disabled={submittingQuestion}
                      className="inline-flex items-center px-4 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary disabled:opacity-50"
                    >
                      {submittingQuestion ? (
                        <>
                          <div className="loading-spinner w-4 h-4 mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Submit & Finish
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : currentQuestion ? (
            /* Question Section */
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </h2>
                  {currentQuestion.is_private && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Private Notes
                    </span>
                  )}
                </div>
                
                <p className="text-gray-700 text-lg leading-relaxed">
                  {currentQuestion.question_text}
                </p>
              </div>
              
              <div className="space-y-4">
                <textarea
                  value={responses[currentQuestion.id] || ''}
                  onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                  placeholder={currentQuestion.placeholder_text || "Write your thoughts, reflections, or notes here..."}
                />
                
                <div className="flex justify-between">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </button>
                  
                  <button
                    onClick={handleNext}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="loading-spinner w-4 h-4 mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        {currentQuestionIndex === questions.length - 1 ? 'Continue to Q&A' : 'Next'}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No questions available for this sermon.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
