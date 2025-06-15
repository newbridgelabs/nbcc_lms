import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import IframePDFViewer from '../../../components/IframePDFViewer'
import { supabase } from '../../../lib/supabase'
import { checkAdminAccess } from '../../../lib/admin-config'
import { getPDFSections, getSectionPDFUrl } from '../../../lib/pdf-utils'
import { ArrowLeft, Eye, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPreviewSection() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      initializeAdminPreview()
    }
  }, [id])

  const initializeAdminPreview = async () => {
    const { isAdmin, user: currentUser } = await checkAdminAccess(router, setUser, setLoading)

    if (isAdmin && currentUser) {
      await loadSectionData()
    }
  }

  const loadSectionData = async () => {
    try {
      // Get all sections
      const { sections: allSections, error: sectionsError } = await getPDFSections(supabase)
      if (sectionsError) {
        throw sectionsError
      }

      // Find current section
      const sectionNumber = parseInt(id)
      const currentSection = allSections?.find(s => s.section_number === sectionNumber)
      
      if (!currentSection) {
        toast.error('Section not found')
        router.push('/admin/upload')
        return
      }
      setSection(currentSection)

      // Get PDF URL
      if (currentSection.file_path) {
        console.log('Admin preview - Section found:', currentSection)
        console.log('Admin preview - File path:', currentSection.file_path)
        const url = await getSectionPDFUrl(currentSection.file_path, supabase)
        console.log('Admin preview - Generated URL:', url)
        setPdfUrl(url)
      } else {
        console.log('Admin preview - No file_path found for section:', currentSection)
      }
    } catch (error) {
      console.error('Error loading section for admin preview:', error)
      toast.error('Failed to load section')
    } finally {
      setLoading(false)
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

  if (!section) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Section Not Found</h2>
            <button
              onClick={() => router.push('/admin/upload')}
              className="px-4 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary"
            >
              Back to Upload
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
                  onClick={() => router.push('/admin/upload')}
                  className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center">
                    <Eye className="h-6 w-6 text-church-primary mr-2" />
                    <h1 className="text-2xl font-bold text-gray-900">
                      Admin Preview: {section.title}
                    </h1>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Section {section.section_number} of {section.total_sections} • Admin View
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {pdfUrl ? (
              <IframePDFViewer
                pdfUrl={pdfUrl}
                title={section.title}
              />
            ) : (
              <div className="p-8 text-center">
                <div className="text-red-600 mb-4">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">PDF Not Available</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    The PDF file could not be loaded. Please check if the file was uploaded correctly.
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/admin/upload')}
                    className="px-4 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary"
                  >
                    Back to Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
