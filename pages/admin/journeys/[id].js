import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import { supabase } from '../../../lib/supabase'
import { checkAdminAccess } from '../../../lib/admin-config'
import { ArrowLeft, Plus, Edit, Trash2, Save, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import MultiSelect from '../../../components/MultiSelect'

export default function JourneyEdit() {
  const [user, setUser] = useState(null)
  const [journey, setJourney] = useState(null)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDay, setShowAddDay] = useState(false)
  const [editingJourney, setEditingJourney] = useState(false)
  const [journeyForm, setJourneyForm] = useState({
    title: '',
    description: '',
    user_tags: ['newcomer']
  })
  const [dayForm, setDayForm] = useState({
    day_number: 1,
    title: '',
    content: '',
    scripture_reference: '',
    reflection_questions: ['', '']
  })
  const [processing, setProcessing] = useState(false)
  const router = useRouter()
  const { id } = router.query

  const userTags = [
    { value: 'newcomer', label: 'Newcomer' },
    { value: 'existing_member', label: 'Existing Member' },
    { value: 'worship_team', label: 'Worship Team' },
    { value: 'admin', label: 'Admin' }
  ]

  useEffect(() => {
    if (id) {
      initializeAdmin()
    }
  }, [id])

  const initializeAdmin = async () => {
    const { isAdmin, user: currentUser } = await checkAdminAccess(router, setUser, setLoading)

    if (isAdmin && currentUser) {
      await loadJourney()
    }
  }

  const loadJourney = async () => {
    try {
      // Load journey details
      const { data: journeyData, error: journeyError } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', id)
        .single()

      if (journeyError) throw journeyError

      // Load journey tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('journey_tags')
        .select('tag_name')
        .eq('journey_id', id)
        .eq('is_active', true)

      if (tagsError) {
        console.warn('Error loading journey tags:', tagsError)
      }

      const journeyTags = tagsData?.map(t => t.tag_name) || [journeyData.user_tag].filter(Boolean)

      setJourney(journeyData)
      setJourneyForm({
        title: journeyData.title,
        description: journeyData.description,
        user_tags: journeyTags
      })

      // Load journey days
      const { data: daysData, error: daysError } = await supabase
        .from('journey_days')
        .select('*')
        .eq('journey_id', id)
        .order('day_number')

      if (daysError) throw daysError

      setDays(daysData || [])

      // Set next day number for new day form
      const maxDayNumber = daysData?.length > 0 ? Math.max(...daysData.map(d => d.day_number)) : 0
      setDayForm(prev => ({ ...prev, day_number: maxDayNumber + 1 }))

    } catch (error) {
      console.error('Error loading journey:', error)
      toast.error('Failed to load journey')
      router.push('/admin/journeys')
    }
  }

  const handleUpdateJourney = async () => {
    setProcessing(true)
    try {
      // Update journey with first tag for backward compatibility
      const { error: journeyError } = await supabase
        .from('journeys')
        .update({
          title: journeyForm.title,
          description: journeyForm.description,
          user_tag: journeyForm.user_tags[0] || 'newcomer',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (journeyError) throw journeyError

      // Update journey tags
      // First, deactivate all existing tags
      const { error: deactivateError } = await supabase
        .from('journey_tags')
        .update({ is_active: false })
        .eq('journey_id', id)

      if (deactivateError) {
        console.warn('Warning: Failed to deactivate old journey tags:', deactivateError)
      }

      // Then insert/reactivate new tags
      if (journeyForm.user_tags.length > 0) {
        const journeyTagsData = journeyForm.user_tags.map(tag => ({
          journey_id: id,
          tag_name: tag,
          is_active: true
        }))

        const { error: tagsError } = await supabase
          .from('journey_tags')
          .upsert(journeyTagsData, {
            onConflict: 'journey_id,tag_name',
            ignoreDuplicates: false
          })

        if (tagsError) {
          console.warn('Warning: Failed to update journey tags:', tagsError)
        }
      }

      toast.success('Journey updated successfully!')
      setEditingJourney(false)
      await loadJourney()
    } catch (error) {
      console.error('Error updating journey:', error)
      toast.error('Failed to update journey')
    } finally {
      setProcessing(false)
    }
  }

  const handleAddDay = async (e) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const { error } = await supabase
        .from('journey_days')
        .insert({
          journey_id: id,
          day_number: dayForm.day_number,
          title: dayForm.title,
          content: dayForm.content,
          scripture_reference: dayForm.scripture_reference,
          reflection_questions: dayForm.reflection_questions.filter(q => q.trim() !== '')
        })

      if (error) throw error

      toast.success('Day added successfully!')
      setShowAddDay(false)
      setDayForm({
        day_number: dayForm.day_number + 1,
        title: '',
        content: '',
        scripture_reference: '',
        reflection_questions: ['', '']
      })
      await loadJourney()
    } catch (error) {
      console.error('Error adding day:', error)
      toast.error('Failed to add day')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteDay = async (dayId, dayTitle) => {
    if (!confirm(`Are you sure you want to delete "${dayTitle}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('journey_days')
        .delete()
        .eq('id', dayId)

      if (error) throw error

      toast.success('Day deleted successfully')
      await loadJourney()
    } catch (error) {
      console.error('Error deleting day:', error)
      toast.error('Failed to delete day')
    }
  }

  const updateReflectionQuestion = (index, value) => {
    setDayForm(prev => ({
      ...prev,
      reflection_questions: prev.reflection_questions.map((q, i) => i === index ? value : q)
    }))
  }

  const addReflectionQuestion = () => {
    setDayForm(prev => ({
      ...prev,
      reflection_questions: [...prev.reflection_questions, '']
    }))
  }

  const removeReflectionQuestion = (index) => {
    setDayForm(prev => ({
      ...prev,
      reflection_questions: prev.reflection_questions.filter((_, i) => i !== index)
    }))
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

  if (!journey) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Journey not found</h3>
            <button
              onClick={() => router.push('/admin/journeys')}
              className="mt-4 text-church-primary hover:text-church-secondary"
            >
              Back to Journeys
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/admin/journeys')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold leading-7 text-gray-900">
                    {editingJourney ? 'Edit Journey' : journey.title}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {editingJourney ? 'Update journey details' : `${days.length} days • ${journey.user_tag} journey`}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                {!editingJourney ? (
                  <>
                    <button
                      onClick={() => setEditingJourney(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Journey
                    </button>
                    <button
                      onClick={() => setShowAddDay(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Day
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingJourney(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateJourney}
                      disabled={processing}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Journey Details */}
          {editingJourney ? (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Journey Details</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={journeyForm.title}
                    onChange={(e) => setJourneyForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={journeyForm.description}
                    onChange={(e) => setJourneyForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                    rows="3"
                  />
                </div>
                <div>
                  <MultiSelect
                    label="User Tags"
                    options={userTags.map(tag => tag.value)}
                    selected={journeyForm.user_tags}
                    onChange={(tags) => setJourneyForm(prev => ({ ...prev, user_tags: tags }))}
                    placeholder="Select user tags..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{journey.title}</h3>
              <p className="text-gray-600 mb-4">{journey.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {journey.user_tag}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  journey.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {journey.is_active ? 'Active' : 'Inactive'}
                </span>
                <span>Created: {new Date(journey.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* Add Day Form Modal */}
          {showAddDay && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Add New Day
                  </h3>
                  <form onSubmit={handleAddDay}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Day Number
                        </label>
                        <input
                          type="number"
                          value={dayForm.day_number}
                          onChange={(e) => setDayForm(prev => ({ ...prev, day_number: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Scripture Reference
                        </label>
                        <input
                          type="text"
                          value={dayForm.scripture_reference}
                          onChange={(e) => setDayForm(prev => ({ ...prev, scripture_reference: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                          placeholder="e.g., John 3:16"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Day Title
                      </label>
                      <input
                        type="text"
                        value={dayForm.title}
                        onChange={(e) => setDayForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                      </label>
                      <textarea
                        value={dayForm.content}
                        onChange={(e) => setDayForm(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                        rows="4"
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reflection Questions
                      </label>
                      {dayForm.reflection_questions.map((question, index) => (
                        <div key={index} className="flex items-center mb-2">
                          <input
                            type="text"
                            value={question}
                            onChange={(e) => updateReflectionQuestion(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                            placeholder={`Question ${index + 1}`}
                          />
                          {dayForm.reflection_questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeReflectionQuestion(index)}
                              className="ml-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addReflectionQuestion}
                        className="text-sm text-church-primary hover:text-church-secondary"
                      >
                        + Add Question
                      </button>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddDay(false)
                          setDayForm({
                            day_number: days.length + 1,
                            title: '',
                            content: '',
                            scripture_reference: '',
                            reflection_questions: ['', '']
                          })
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-church-primary hover:bg-church-secondary rounded-md disabled:opacity-50"
                      >
                        {processing ? 'Adding...' : 'Add Day'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Journey Days */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Journey Days ({days.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage the daily content for this journey
              </p>
            </div>
            
            {days.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No days added</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding the first day to this journey.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {days.map((day) => (
                  <li key={day.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {day.day_number}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {day.title}
                            </p>
                            {day.scripture_reference && (
                              <span className="ml-2 text-xs text-blue-600">
                                {day.scripture_reference}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {day.content}
                          </p>
                          <p className="text-xs text-gray-400">
                            {day.reflection_questions?.length || 0} reflection questions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/journeys/${journey.id}/days/${day.id}`)}
                          className="text-church-primary hover:text-church-secondary"
                          title="Edit day"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDay(day.id, day.title)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete day"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
