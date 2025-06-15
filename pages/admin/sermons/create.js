import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import { getCurrentUser } from '../../../lib/supabase'
import { checkAdminStatus } from '../../../lib/admin-config'
import { Plus, Minus, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateSermon() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sermon_date: '',
    pastor_name: '',
    scripture_reference: ''
  })

  const [questions, setQuestions] = useState([
    {
      question_text: '',
      is_private: true,
      placeholder_text: ''
    }
  ])

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
    } catch (error) {
      console.error('Error checking access:', error)
      toast.error('Failed to verify access')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      placeholder_text: ''
    }])
  }

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.sermon_date) {
      toast.error('Title and sermon date are required')
      return
    }

    const validQuestions = questions.filter(q => q.question_text.trim())
    if (validQuestions.length === 0) {
      toast.error('At least one question is required')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/sermons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          questions: validQuestions
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Sermon created successfully!')
        router.push('/admin/sermons')
      } else {
        throw new Error(data.error || 'Failed to create sermon')
      }
    } catch (error) {
      console.error('Error creating sermon:', error)
      toast.error(error.message || 'Failed to create sermon')
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin/sermons')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Create New Sermon
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Set up an interactive sermon with questions and notes
                </p>
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
                    placeholder="Pastor's name"
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
                    placeholder="e.g., John 3:16, Romans 8:28-30"
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
              </div>
            </div>

            {/* Questions Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Sermon Questions & Notes
                </h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Question {index + 1}
                      </h3>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Minus className="h-4 w-4" />
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
                          placeholder="Enter your question or prompt"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Placeholder Text
                        </label>
                        <input
                          type="text"
                          value={question.placeholder_text}
                          onChange={(e) => handleQuestionChange(index, 'placeholder_text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-church-primary focus:border-church-primary"
                          placeholder="Hint text for users"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleQuestionChange(index, 'is_private', !question.is_private)}
                          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                            question.is_private
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}
                        >
                          {question.is_private ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Private Notes (User Only)
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Visible to Admin
                            </>
                          )}
                        </button>
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
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-6 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Sermon
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
