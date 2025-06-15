import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import IframePDFViewer from '../../components/IframePDFViewer'
import MultimediaContent from '../../components/MultimediaContent'
import ProgressTracker from '../../components/ProgressTracker'
import { getCurrentUser } from '../../lib/supabase'
import { getPDFSections, getSectionPDFUrl, markSectionComplete, getUserProgress } from '../../lib/pdf-utils'
import { supabase } from '../../lib/supabase'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SectionPage() {
  const [user, setUser] = useState(null)
  const [sections, setSections] = useState([])
  const [currentSection, setCurrentSection] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [multimediaContent, setMultimediaContent] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      loadSectionData()
    }
  }, [id])

  const loadSectionData = async () => {
    try {
      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      setUser(currentUser)

      // Get all sections
      const { sections: allSections, error: sectionsError } = await getPDFSections(supabase)
      if (sectionsError) {
        throw sectionsError
      }
      setSections(allSections || [])

      // Find current section
      const sectionNumber = parseInt(id)
      const section = allSections?.find(s => s.section_number === sectionNumber)
      
      if (!section) {
        toast.error('Section not found')
        router.push('/dashboard')
        return
      }
      setCurrentSection(section)

      // Get PDF URL
      if (section.file_path) {
        console.log('Section found:', section)
        console.log('File path:', section.file_path)
        const url = await getSectionPDFUrl(section.file_path, supabase)
        console.log('Generated URL:', url)
        setPdfUrl(url)
      } else {
        console.log('No file_path found for section:', section)
      }

      // Get multimedia content for this section
      try {
        const response = await fetch(`/api/admin/multimedia-content?section_id=${section.id}`)
        const contentData = await response.json()
        if (response.ok) {
          setMultimediaContent(contentData.content || [])
        } else {
          // If table doesn't exist yet, just continue without multimedia content
          console.log('Multimedia content not available yet:', contentData.error)
          setMultimediaContent([])
        }
      } catch (error) {
        console.log('Multimedia content not available:', error)
        setMultimediaContent([])
      }

      // Get user progress
      const { progress: userProgress, error: progressError } = await getUserProgress(currentUser.id, supabase)
      if (progressError) {
        console.error('Error loading progress:', progressError)
      } else {
        setProgress(userProgress || [])
      }
    } catch (error) {
      console.error('Error loading section:', error)
      toast.error('Failed to load section')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteSection = async () => {
    if (!user || !currentSection) {
      toast.error('User or section not found')
      return
    }

    setCompleting(true)
    try {
      console.log('Attempting to complete section:', {
        userId: user.id,
        sectionId: currentSection.id,
        sectionNumber: currentSection.section_number
      })

      const { data, error } = await markSectionComplete(user.id, currentSection.id, supabase)

      if (error) {
        console.error('Section completion error:', error)
        throw new Error(error.message || 'Failed to mark section as complete')
      }

      console.log('Section completed successfully:', data)
      toast.success('Section completed!')

      // Reload progress with error handling
      try {
        const { progress: updatedProgress, error: progressError } = await getUserProgress(user.id, supabase)
        if (progressError) {
          console.error('Error reloading progress:', progressError)
        } else {
          setProgress(updatedProgress || [])
          console.log('Progress updated after completion:', updatedProgress)
          console.log('Updated progress details:', updatedProgress?.map(p => ({
            sectionId: p.section_id,
            sectionNumber: p.pdf_sections?.section_number,
            completed: p.completed
          })))
        }
      } catch (progressErr) {
        console.error('Failed to reload progress:', progressErr)
        // Don't fail the whole operation if progress reload fails
      }

      // Small delay to ensure state updates and then navigate
      setTimeout(() => {
        // Navigate to next section or dashboard
        const nextSectionNumber = currentSection.section_number + 1
        const nextSection = sections.find(s => s.section_number === nextSectionNumber)

        console.log('Navigation decision:', {
          currentSectionNumber: currentSection.section_number,
          nextSectionNumber,
          nextSectionExists: !!nextSection,
          totalSections: sections.length
        })

        if (nextSection) {
          console.log('Navigating to next section:', nextSectionNumber)
          router.push(`/sections/${nextSectionNumber}`)
        } else {
          // All sections completed, go to agreement
          console.log('All sections completed, navigating to agreement')
          router.push('/agreement')
        }
      }, 1000) // Increased delay to ensure database updates are reflected

    } catch (error) {
      console.error('Error completing section:', error)
      toast.error(error.message || 'Failed to complete section')
    } finally {
      setCompleting(false)
    }
  }

  const handleSectionClick = (sectionNumber) => {
    if (sectionNumber === 'agreement') {
      router.push('/agreement')
    } else {
      router.push(`/sections/${sectionNumber}`)
    }
  }

  const isCurrentSectionCompleted = () => {
    if (!currentSection || !progress) return false
    return progress.some(p => p.section_id === currentSection.id && p.completed)
  }

  const getCompletedSections = () => {
    return progress.filter(p => p.completed && p.pdf_sections).map(p => p.pdf_sections.section_number)
  }

  const canAccessCurrentSection = () => {
    if (!currentSection || !sections) return false
    
    // First section is always accessible
    if (currentSection.section_number === 1) return true
    
    // Check if previous section is completed
    const previousSectionNumber = currentSection.section_number - 1
    const completedSections = getCompletedSections()
    return completedSections.includes(previousSectionNumber)
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

  if (!currentSection) {
    return (
      <Layout requireAuth>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Section Not Found</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-church-primary text-white rounded hover:bg-church-secondary"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (!canAccessCurrentSection()) {
    return (
      <Layout requireAuth>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Section Locked</h1>
            <p className="text-gray-600 mb-6">
              You need to complete the previous sections before accessing this one.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-church-primary text-white rounded hover:bg-church-secondary"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    )
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
                  onClick={() => router.push('/dashboard')}
                  className="mr-3 sm:mr-4 p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                    {currentSection.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Section {currentSection.section_number} of {sections.length}
                  </p>
                </div>
              </div>
              
              {isCurrentSectionCompleted() && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Multimedia Content */}
                {multimediaContent.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="space-y-8">
                      {multimediaContent.map((content) => (
                        <MultimediaContent key={content.id} content={content} />
                      ))}
                    </div>
                  </div>
                )}

                {/* PDF Content (if available and no multimedia content, or as additional content) */}
                {pdfUrl && (
                  <IframePDFViewer
                    pdfUrl={pdfUrl}
                    title={currentSection.title}
                  />
                )}

                {/* No Content Message */}
                {!pdfUrl && multimediaContent.length === 0 && (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">No content is available for this section yet.</p>
                  </div>
                )}

                {/* Complete Section Button */}
                {(pdfUrl || multimediaContent.length > 0) && !isCurrentSectionCompleted() && (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <button
                      onClick={handleCompleteSection}
                      disabled={completing}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {completing ? 'Completing...' : 'Mark Section as Complete'}
                    </button>
                    <p className="text-sm text-gray-600 mt-2">
                      Click to proceed to the next section
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 section-navigation">
                <button
                  onClick={() => {
                    const prevSection = currentSection.section_number - 1
                    if (prevSection >= 1) {
                      router.push(`/sections/${prevSection}`)
                    } else {
                      router.push('/dashboard')
                    }
                  }}
                  className="flex items-center justify-center px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 min-h-[44px] transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{currentSection.section_number > 1 ? 'Previous Section' : 'Dashboard'}</span>
                </button>

                <button
                  onClick={() => {
                    const nextSection = currentSection.section_number + 1
                    const nextSectionExists = sections.find(s => s.section_number === nextSection)
                    if (nextSectionExists) {
                      router.push(`/sections/${nextSection}`)
                    } else {
                      router.push('/agreement')
                    }
                  }}
                  disabled={!isCurrentSectionCompleted()}
                  className="flex items-center justify-center px-4 py-3 sm:py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors duration-200"
                >
                  <span className="truncate">{currentSection.section_number < sections.length ? 'Next Section' : 'Agreement'}</span>
                  <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" />
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <ProgressTracker
                sections={sections}
                currentSection={currentSection.section_number}
                completedSections={getCompletedSections()}
                onSectionClick={handleSectionClick}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
