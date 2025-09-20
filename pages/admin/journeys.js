import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { checkAdminAccess } from '../../lib/admin-config'
import { ArrowLeft, Plus, Edit, Trash2, Eye, BookOpen, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import MultiSelect from '../../components/MultiSelect'

export default function JourneysManagement() {
  const [user, setUser] = useState(null)
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    userTags: ['newcomer']
  })
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const userTags = [
    { value: 'newcomer', label: 'Newcomer' },
    { value: 'existing_member', label: 'Existing Member' },
    { value: 'worship_team', label: 'Worship Team' },
    { value: 'admin', label: 'Admin' }
  ]

  useEffect(() => {
    initializeAdmin()
  }, [])

  const initializeAdmin = async () => {
    const { isAdmin, user: currentUser } = await checkAdminAccess(router, setUser, setLoading)

    if (isAdmin && currentUser) {
      await loadJourneys()
    }
  }

  const loadJourneys = async () => {
    try {
      const { data, error } = await supabase
        .from('journeys')
        .select(`
          *,
          journey_days (
            id,
            day_number,
            title
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJourneys(data || [])
    } catch (error) {
      console.error('Error loading journeys:', error)
      toast.error('Failed to load journeys')
    }
  }

  const handleCreateJourney = async (e) => {
    e.preventDefault()
    setProcessing(true)

    try {
      // Create the journey with the first tag as the primary user_tag for backward compatibility
      const { data: journeyData, error: journeyError } = await supabase
        .from('journeys')
        .insert({
          title: formData.title,
          description: formData.description,
          user_tag: formData.userTags[0] || 'newcomer', // Keep first tag for backward compatibility
          created_by: user.id,
          is_active: true
        })
        .select()
        .single()

      if (journeyError) throw journeyError

      // Create journey_tags entries for all selected tags
      if (formData.userTags.length > 0) {
        const journeyTagsData = formData.userTags.map(tag => ({
          journey_id: journeyData.id,
          tag_name: tag,
          is_active: true
        }))

        const { error: tagsError } = await supabase
          .from('journey_tags')
          .insert(journeyTagsData)

        if (tagsError) {
          console.warn('Warning: Failed to create journey tags:', tagsError)
          // Don't fail the whole operation for this
        }
      }

      toast.success('Journey created successfully!')
      setShowCreateForm(false)
      setFormData({ title: '', description: '', userTags: ['newcomer'] })
      await loadJourneys()
    } catch (error) {
      console.error('Error creating journey:', error)
      toast.error('Failed to create journey')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteJourney = async (journeyId, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all associated days and user progress.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('journeys')
        .delete()
        .eq('id', journeyId)

      if (error) throw error

      toast.success('Journey deleted successfully')
      await loadJourneys()
    } catch (error) {
      console.error('Error deleting journey:', error)
      toast.error('Failed to delete journey')
    }
  }

  const toggleJourneyStatus = async (journeyId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('journeys')
        .update({ is_active: !currentStatus })
        .eq('id', journeyId)

      if (error) throw error

      toast.success(`Journey ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      await loadJourneys()
    } catch (error) {
      console.error('Error updating journey status:', error)
      toast.error('Failed to update journey status')
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/admin')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold leading-7 text-gray-900">
                    Journey Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Create and manage journeys for different user groups
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Journey
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Create Journey Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Create New Journey
                  </h3>
                  <form onSubmit={handleCreateJourney}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Journey Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary"
                        rows="3"
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <MultiSelect
                        label="User Tags"
                        options={userTags.map(tag => tag.value)}
                        selected={formData.userTags}
                        onChange={(tags) => setFormData(prev => ({ ...prev, userTags: tags }))}
                        placeholder="Select user tags..."
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false)
                          setFormData({ title: '', description: '', userTags: ['newcomer'] })
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
                        {processing ? 'Creating...' : 'Create Journey'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Journeys List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                All Journeys ({journeys.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage journeys for different user groups
              </p>
            </div>
            
            {journeys.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No journeys</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first journey.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {journeys.map((journey) => (
                  <li key={journey.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-church-primary flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {journey.title}
                            </p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              journey.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {journey.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {journey.user_tag}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{journey.description}</p>
                          <p className="text-xs text-gray-400">
                            {journey.journey_days?.length || 0} days • Created: {new Date(journey.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/journeys/${journey.id}`)}
                          className="text-church-primary hover:text-church-secondary"
                          title="Edit journey"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleJourneyStatus(journey.id, journey.is_active)}
                          className={`${journey.is_active ? 'text-gray-600' : 'text-green-600'} hover:opacity-75`}
                          title={journey.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteJourney(journey.id, journey.title)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete journey"
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
