import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import MultimediaContent from '../../../components/MultimediaContent'
import { supabase } from '../../../lib/supabase'
import { getPDFSections } from '../../../lib/pdf-utils'
import { Plus, Edit, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSectionContent() {
  const router = useRouter()
  const { section_id } = router.query
  
  const [section, setSection] = useState(null)
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContent, setEditingContent] = useState(null)
  const [newContent, setNewContent] = useState({
    content_type: 'text',
    title: '',
    content_data: {}
  })

  useEffect(() => {
    if (section_id) {
      loadSectionAndContent()
    }
  }, [section_id])

  const loadSectionAndContent = async () => {
    try {
      // Load section info
      const { sections } = await getPDFSections(supabase)
      const currentSection = sections?.find(s => s.id === section_id)
      setSection(currentSection)

      // Load multimedia content
      const response = await fetch(`/api/admin/multimedia-content?section_id=${section_id}`)
      const data = await response.json()
      
      if (response.ok) {
        setContent(data.content || [])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error loading content:', error)
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContent = async () => {
    try {
      const response = await fetch('/api/admin/multimedia-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: section_id,
          ...newContent
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setContent([...content, data.content])
        setNewContent({ content_type: 'text', title: '', content_data: {} })
        setShowAddForm(false)
        toast.success('Content added successfully')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error adding content:', error)
      toast.error('Failed to add content')
    }
  }

  const handleUpdateContent = async (contentId, updates) => {
    try {
      const response = await fetch('/api/admin/multimedia-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contentId, ...updates })
      })

      const data = await response.json()
      
      if (response.ok) {
        setContent(content.map(c => c.id === contentId ? data.content : c))
        setEditingContent(null)
        toast.success('Content updated successfully')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error updating content:', error)
      toast.error('Failed to update content')
    }
  }

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const response = await fetch(`/api/admin/multimedia-content?id=${contentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setContent(content.filter(c => c.id !== contentId))
        toast.success('Content deleted successfully')
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      toast.error('Failed to delete content')
    }
  }

  const moveContent = async (contentId, direction) => {
    const currentIndex = content.findIndex(c => c.id === contentId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= content.length) return

    const newOrder = [...content]
    const [movedItem] = newOrder.splice(currentIndex, 1)
    newOrder.splice(newIndex, 0, movedItem)

    // Update display orders
    const updates = newOrder.map((item, index) => ({
      id: item.id,
      display_order: index
    }))

    try {
      for (const update of updates) {
        await handleUpdateContent(update.id, { display_order: update.display_order })
      }
      
      // Reload content to reflect new order
      await loadSectionAndContent()
    } catch (error) {
      console.error('Error reordering content:', error)
      toast.error('Failed to reorder content')
    }
  }

  const renderContentForm = (contentData, isEditing = false) => {
    const data = contentData || newContent
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              value={data.content_type}
              onChange={(e) => {
                const updated = { ...data, content_type: e.target.value, content_data: {} }
                isEditing ? setEditingContent(updated) : setNewContent(updated)
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="text">Rich Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="pdf">PDF Document</option>
              <option value="embed">Embed Code</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => {
                const updated = { ...data, title: e.target.value }
                isEditing ? setEditingContent(updated) : setNewContent(updated)
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Enter content title"
            />
          </div>

          {/* Content-specific fields */}
          {data.content_type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={data.content_data.plain_text || ''}
                onChange={(e) => {
                  const updated = {
                    ...data,
                    content_data: { ...data.content_data, plain_text: e.target.value }
                  }
                  isEditing ? setEditingContent(updated) : setNewContent(updated)
                }}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter your text content"
              />
            </div>
          )}

          {(data.content_type === 'image' || data.content_type === 'video' || data.content_type === 'audio' || data.content_type === 'pdf') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <input
                type="url"
                value={data.content_data.url || ''}
                onChange={(e) => {
                  const updated = {
                    ...data,
                    content_data: { ...data.content_data, url: e.target.value }
                  }
                  isEditing ? setEditingContent(updated) : setNewContent(updated)
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter URL"
              />
            </div>
          )}

          {data.content_type === 'embed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Embed Code
              </label>
              <textarea
                value={data.content_data.embed_code || ''}
                onChange={(e) => {
                  const updated = {
                    ...data,
                    content_data: { ...data.content_data, embed_code: e.target.value }
                  }
                  isEditing ? setEditingContent(updated) : setNewContent(updated)
                }}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Paste embed code here"
              />
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={isEditing ? 
                () => handleUpdateContent(data.id, { title: data.title, content_data: data.content_data }) :
                handleAddContent
              }
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              {isEditing ? 'Update' : 'Add'} Content
            </button>
            <button
              onClick={() => {
                isEditing ? setEditingContent(null) : setShowAddForm(false)
                if (!isEditing) setNewContent({ content_type: 'text', title: '', content_data: {} })
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2 inline" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Manage Section Content
                </h1>
                <p className="mt-2 text-gray-600">
                  {section ? `${section.title} - Section ${section.section_number}` : 'Loading...'}
                </p>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Back to Admin
              </button>
            </div>
          </div>

          {/* Add Content Button */}
          {!showAddForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </button>
            </div>
          )}

          {/* Add Content Form */}
          {showAddForm && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Add New Content</h2>
              {renderContentForm()}
            </div>
          )}

          {/* Content List */}
          <div className="space-y-6">
            {content.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No content added yet. Click "Add Content" to get started.</p>
              </div>
            ) : (
              content.map((item, index) => (
                <div key={item.id} className="bg-white rounded-lg shadow">
                  {/* Content Management Header */}
                  <div className="border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {item.content_type.toUpperCase()}
                        </span>
                        {item.title && (
                          <span className="font-medium text-gray-900">{item.title}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => moveContent(item.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveContent(item.id, 'down')}
                          disabled={index === content.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingContent(item)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContent(item.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content Preview/Edit */}
                  <div className="p-6">
                    {editingContent?.id === item.id ? (
                      renderContentForm(editingContent, true)
                    ) : (
                      <MultimediaContent content={item} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
