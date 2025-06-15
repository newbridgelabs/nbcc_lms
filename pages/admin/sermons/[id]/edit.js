import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../../components/Layout'
import { getCurrentUser } from '../../../../lib/supabase'
import { checkAdminStatus } from '../../../../lib/admin-config'
import { authenticatedFetch } from '../../../../lib/api-client'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditSermon() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const { id } = router.query

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sermon_date: '',
    pastor_name: '',
    scripture_reference: '',
    is_active: true
  })

  const [questions, setQuestions] = useState([])

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

      await loadSermonData()
    } catch (error) {
      console.error('Error checking access:', error)
      toast.error('Failed to verify access')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadSermonData = async () => {
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

      // Set form data
      setFormData({
        title: currentSermon.title || '',
        description: currentSermon.description || '',
        sermon_date: currentSermon.sermon_date || '',
        pastor_name: currentSermon.pastor_name || '',
        scripture_reference: currentSermon.scripture_reference || '',
        is_active: currentSermon.is_active
      })

      // Set questions
      const sermonQuestions = currentSermon.sermon_questions || []
      setQuestions(sermonQuestions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        is_private: q.is_private,
        placeholder_text: q.placeholder_text || '',
        question_order: q.question_order
      })))

    } catch (error) {
      console.error('Error loading sermon data:', error)
      toast.error('Failed to load sermon data')
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleQuestionChange = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ))
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      question_text: '',
      is_private: true,
      placeholder_text: '',
      question_order: prev.length + 1
    }])
  }

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Please enter a sermon title')
      return
    }

    if (!formData.sermon_date) {
      toast.error('Please select a sermon date')
      return
    }

    const validQuestions = questions.filter(q => q.question_text.trim())
    if (validQuestions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    setSubmitting(true)

    try {
      const response = await authenticatedFetch(`/api/sermons/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          questions: validQuestions.map((q, index) => ({
            ...q,
            question_order: index + 1
          }))
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Sermon updated successfully!')
        router.push('/admin/sermons')
      } else {
        throw new Error(data.error || 'Failed to update sermon')
      }
    } catch (error) {
      console.error('Error updating sermon:', error)
      toast.error(error.message || 'Failed to update sermon')
    } finally {
      setSubmitting(false)
    }
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
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/admin/sermons')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">
                  Edit Sermon
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Sermon Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sermon Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                    placeholder="Enter sermon title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sermon Date *
                  </label>
                  <input
                    type="date"
                    name="sermon_date"
                    value={formData.sermon_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pastor Name
                  </label>
                  <input
                    type="text"
                    name="pastor_name"
                    value={formData.pastor_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                    placeholder="Enter pastor name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scripture Reference
                  </label>
                  <input
                    type="text"
                    name="scripture_reference"
                    value={formData.scripture_reference}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                    placeholder="e.g., John 3:16, Romans 8:28"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                    placeholder="Brief description of the sermon"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-church-primary focus:ring-church-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Active (visible to users)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Questions & Outline Points
                </h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">
                        Question {index + 1}
                      </h3>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Text *
                        </label>
                        <textarea
                          value={question.question_text}
                          onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                          placeholder="Enter your question or outline point"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Placeholder Text (optional)
                        </label>
                        <input
                          type="text"
                          value={question.placeholder_text}
                          onChange={(e) => handleQuestionChange(index, 'placeholder_text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                          placeholder="Helpful hint for users"
                        />
                      </div>

                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={question.is_private}
                            onChange={(e) => handleQuestionChange(index, 'is_private', e.target.checked)}
                            className="rounded border-gray-300 text-church-primary focus:ring-church-primary"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Private notes (only visible to user)
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {question.is_private 
                            ? 'Users can take private notes. Only they can see their responses.'
                            : 'Public Q&A section. Admin can see questions but not who asked them.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin/sermons')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-6 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Sermon
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
