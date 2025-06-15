import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import ProgressTracker from '../components/ProgressTracker'
import SermonNotesWidget from '../components/SermonNotesWidget'
import { getCurrentUser } from '../lib/supabase'
import { getPDFSections, getUserProgress } from '../lib/pdf-utils'
import { supabase } from '../lib/supabase'
import { checkAdminStatus } from '../lib/admin-config'
import { BookOpen, FileText, User, Clock, CheckCircle, Upload, RefreshCw, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [sections, setSections] = useState([])
  const [progress, setProgress] = useState([])
  const [agreement, setAgreement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    completedSections: 0,
    totalSections: 0,
    progressPercentage: 0
  })
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Refresh data when the page becomes visible (user returns from section)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing dashboard data...')
        loadDashboardData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...')

      // Get current user
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      setUser(currentUser)
      console.log('Current user:', currentUser.id)

      // Check if user is admin and redirect to admin dashboard
      const isAdmin = await checkAdminStatus(currentUser.id, currentUser.email)
      if (isAdmin) {
        console.log('User is admin, redirecting to admin dashboard')
        router.push('/admin')
        return
      }

      // Get PDF sections
      const { sections: pdfSections, error: sectionsError } = await getPDFSections(supabase)
      if (sectionsError) {
        console.error('Error loading sections:', sectionsError)
        // If no sections exist, show upload option
        setSections([])
      } else {
        setSections(pdfSections || [])
        console.log('Loaded sections:', pdfSections?.length || 0)
      }

      // Get user progress
      const { progress: userProgress, error: progressError } = await getUserProgress(currentUser.id, supabase)
      if (progressError) {
        console.error('Error loading progress:', progressError)
        setProgress([])
        setStats({
          completedSections: 0,
          totalSections: pdfSections?.length || 0,
          progressPercentage: 0
        })
      } else {
        const validProgress = userProgress || []
        setProgress(validProgress)
        console.log('Loaded progress:', validProgress.length, 'entries')
        console.log('Progress details:', validProgress.map(p => ({
          sectionId: p.section_id,
          sectionNumber: p.pdf_sections?.section_number,
          completed: p.completed,
          title: p.pdf_sections?.title
        })))

        // Calculate stats
        const completedCount = validProgress.filter(p => p.completed && p.pdf_sections).length
        const totalCount = pdfSections?.length || 0
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

        console.log('Progress stats:', { completedCount, totalCount, percentage })

        setStats({
          completedSections: completedCount,
          totalSections: totalCount,
          progressPercentage: percentage
        })
      }

      // Get user's agreement status
      const { data: agreementData, error: agreementError } = await supabase
        .from('agreements')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      if (agreementData) {
        setAgreement(agreementData)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionClick = (sectionNumber) => {
    if (sectionNumber === 'agreement') {
      if (agreement) {
        router.push('/agreement-status')
      } else {
        router.push('/agreement')
      }
    } else {
      router.push(`/sections/${sectionNumber}`)
    }
  }

  const getNextSection = () => {
    const completedSectionIds = progress.filter(p => p.completed && p.pdf_sections).map(p => p.section_id)
    const nextSection = sections.find(section => !completedSectionIds.includes(section.id))
    console.log('Next section calculation:', {
      completedSectionIds,
      nextSection: nextSection?.section_number,
      totalSections: sections.length
    })
    return nextSection ? nextSection.section_number : null
  }

  const canAccessAgreement = () => {
    return stats.completedSections === stats.totalSections && stats.totalSections > 0
  }

  const handleRefresh = async () => {
    toast.success('Refreshing progress...')
    await loadDashboardData()
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

  return (
    <Layout requireAuth>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-7 text-gray-900 truncate">
                  Welcome back, {user?.user_metadata?.full_name || user?.email}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Continue your journey to church membership
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Progress
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {sections.length === 0 ? (
            // No sections uploaded yet
            <div className="text-center py-8 sm:py-12">
              <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No study materials available</h3>
              <p className="mt-1 text-sm text-gray-500 px-4">
                The church administrator needs to upload the study materials first.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-3 sm:py-2 border border-transparent shadow-sm text-base sm:text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary min-h-[44px]"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 dashboard-stats">
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <BookOpen className="h-6 w-6 text-church-primary" />
                        </div>
                        <div className="ml-3 sm:ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                              Sections Completed
                            </dt>
                            <dd className="text-lg sm:text-xl font-medium text-gray-900">
                              {stats.completedSections} / {stats.totalSections}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-3 sm:ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                              Progress
                            </dt>
                            <dd className="text-lg sm:text-xl font-medium text-gray-900">
                              {stats.progressPercentage}%
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {canAccessAgreement() ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <FileText className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-3 sm:ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                              Agreement
                            </dt>
                            <dd className="text-lg sm:text-xl font-medium text-gray-900">
                              {agreement
                                ? (agreement.status === 'completed' ? 'Approved' : 'Pending')
                                : (canAccessAgreement() ? 'Ready' : 'Locked')
                              }
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-4 sm:py-5 sm:p-6">
                    <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-4">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                      {getNextSection() && (
                        <button
                          onClick={() => handleSectionClick(getNextSection())}
                          className="inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-transparent text-base sm:text-sm font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary min-h-[44px] w-full transition-colors duration-200"
                        >
                          <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Continue Section {getNextSection()}</span>
                        </button>
                      )}

                      {canAccessAgreement() && (
                        <button
                          onClick={() => handleSectionClick('agreement')}
                          className={`inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-transparent text-base sm:text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] w-full transition-colors duration-200 ${
                            agreement
                              ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          }`}
                        >
                          <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{agreement ? 'View Agreement Status' : 'Complete Agreement'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => router.push('/sections/1')}
                        className="inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-gray-300 text-base sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary min-h-[44px] w-full transition-colors duration-200"
                      >
                        <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">View All Sections</span>
                      </button>

                      <button
                        onClick={() => router.push('/sermons')}
                        className="inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-gray-300 text-base sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary min-h-[44px] w-full transition-colors duration-200"
                      >
                        <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Sermon Notes</span>
                      </button>

                      <button
                        onClick={handleRefresh}
                        className="inline-flex items-center justify-center px-4 py-3 sm:py-2 border border-gray-300 text-base sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary min-h-[44px] w-full transition-colors duration-200"
                      >
                        <RefreshCw className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Refresh Progress</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-8">
                <ProgressTracker
                  sections={sections}
                  currentSection={getNextSection() || 1}
                  completedSections={progress.filter(p => p.completed && p.pdf_sections).map(p => p.pdf_sections.section_number)}
                  onSectionClick={handleSectionClick}
                />

                <SermonNotesWidget user={user} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
