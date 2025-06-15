import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { checkAdminAccess } from '../../lib/admin-config'
import { splitPDFIntoSections, uploadPDFSections } from '../../lib/pdf-utils'
import { Upload, FileText, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UploadStudyMaterials() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [sectionsCount, setSectionsCount] = useState(5)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [existingSections, setExistingSections] = useState([])
  const router = useRouter()

  useEffect(() => {
    initializeAdmin()
  }, [])

  const initializeAdmin = async () => {
    const { isAdmin, user: currentUser } = await checkAdminAccess(router, setUser, setLoading)

    if (isAdmin && currentUser) {
      await loadExistingSections()
    }
  }

  const loadExistingSections = async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_sections')
        .select('*')
        .order('section_number')

      if (error) throw error
      setExistingSections(data || [])
    } catch (error) {
      console.error('Error loading sections:', error)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      toast.error('Please select a valid PDF file')
      e.target.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file')
      return
    }

    if (sectionsCount < 1 || sectionsCount > 10) {
      toast.error('Number of sections must be between 1 and 10')
      return
    }

    setUploading(true)
    setUploadProgress('Splitting PDF into sections...')

    try {
      // Confirm replacement if sections exist
      if (existingSections.length > 0) {
        const confirmReplace = window.confirm(
          `This will replace ${existingSections.length} existing sections. Continue?`
        )
        if (!confirmReplace) {
          setUploading(false)
          setUploadProgress(null)
          return
        }
      }

      // Split PDF into sections
      const { sections, error: splitError } = await splitPDFIntoSections(selectedFile, sectionsCount)
      
      if (splitError) {
        throw new Error('Failed to split PDF: ' + splitError.message)
      }

      setUploadProgress('Uploading sections to storage...')

      // Upload sections to Supabase
      const { sections: uploadedSections, error: uploadError } = await uploadPDFSections(sections, supabase)
      
      if (uploadError) {
        throw new Error('Failed to upload sections: ' + uploadError.message)
      }

      setUploadProgress('Upload completed successfully!')
      toast.success(`Successfully uploaded ${uploadedSections.length} sections!`)
      
      // Refresh existing sections
      await loadExistingSections()
      
      // Reset form
      setSelectedFile(null)
      document.getElementById('pdf-file').value = ''
      
      setTimeout(() => {
        setUploadProgress(null)
      }, 3000)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload PDF')
      setUploadProgress(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('pdf_sections')
        .delete()
        .eq('id', sectionId)

      if (error) throw error

      toast.success('Section deleted successfully')
      await loadExistingSections()
    } catch (error) {
      console.error('Error deleting section:', error)
      toast.error('Failed to delete section')
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
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold leading-7 text-gray-900">
                  Upload Study Materials
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Upload and manage PDF study materials for church membership
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Upload Form */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Upload New PDF</h2>
            
            <div className="space-y-6">
              {/* File Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select PDF File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="pdf-file"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-church-primary hover:text-church-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-church-primary"
                      >
                        <span>Upload a PDF file</span>
                        <input
                          id="pdf-file"
                          name="pdf-file"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 50MB</p>
                  </div>
                </div>
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Sections Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Sections
                </label>
                <select
                  value={sectionsCount}
                  onChange={(e) => setSectionsCount(parseInt(e.target.value))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-church-primary focus:border-church-primary"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} sections</option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  The PDF will be automatically divided into this many sections
                </p>
              </div>

              {/* Upload Progress */}
              {uploadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center">
                    {uploading ? (
                      <div className="loading-spinner w-5 h-5 mr-3"></div>
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    )}
                    <p className="text-sm text-blue-800">{uploadProgress}</p>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="px-6 py-2 bg-church-primary text-white font-medium rounded-md hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload PDF
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Existing Sections */}
          {existingSections.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Current Study Sections ({existingSections.length})
              </h2>
              
              <div className="space-y-4">
                {existingSections.map((section) => (
                  <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-500">
                        Section {section.section_number} of {section.total_sections}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/admin/preview/${section.section_number}`)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => router.push(`/admin/content/${section.id}`)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Manage Content
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
