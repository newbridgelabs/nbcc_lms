import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase, getCurrentUser, signOut } from '../lib/supabase'
import { checkAdminStatus } from '../lib/admin-config'
import { LogOut, Home, BookOpen, FileText, Menu, X } from 'lucide-react'
import DemoNotification from './DemoNotification'
import EmailService from './EmailService'
import toast from 'react-hot-toast'

export default function Layout({ children, requireAuth = false }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()

    // Only set up auth state change listener if supabase is configured
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 Auth state change:', event, session?.user?.email)
          if (event === 'SIGNED_IN') {
            setUser(session?.user || null)
            // Check admin status for new user
            if (session?.user) {
              const adminStatus = await checkAdminStatus(session.user.id, session.user.email)
              setIsAdmin(adminStatus)
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setIsAdmin(false)
            router.push('/')
          }
          setLoading(false)
        }
      )

      return () => subscription?.unsubscribe()
    } else {
      setLoading(false)
    }
  }, [])

  const checkUser = async () => {
    try {
      if (supabase) {
        const user = await getCurrentUser()
        setUser(user)

        // Check admin status if user exists
        if (user) {
          const adminStatus = await checkAdminStatus(user.id, user.email)
          setIsAdmin(adminStatus)
        } else {
          setIsAdmin(false)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navigation helper functions
  const handleDashboardClick = () => {
    if (isAdmin) {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  const handleStudyMaterialsClick = () => {
    if (isAdmin) {
      router.push('/admin/upload')
    } else {
      router.push('/sections/1')
    }
  }

  const handleAgreementClick = () => {
    if (isAdmin) {
      router.push('/admin/agreements')
    } else {
      router.push('/agreement')
    }
  }

  const handleSermonsClick = () => {
    if (isAdmin) {
      router.push('/admin/sermons')
    } else {
      router.push('/sermons')
    }
  }

  const handleSignOut = async () => {
    try {
      if (supabase) {
        await signOut()
        toast.success('Signed out successfully')
      } else {
        setUser(null)
        toast.success('Signed out successfully')
      }
      router.push('/')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  // Redirect if auth is required but user is not logged in
  useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.push('/auth/login')
    }
  }, [loading, requireAuth, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // Don't render protected content if auth is required but user is not logged in
  if (requireAuth && !user) {
    return null
  }

  // Don't show user info on auth pages to prevent confusion
  const isAuthPage = router.pathname.startsWith('/auth/')
  const showUserInfo = user && !isAuthPage

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Initialize EmailJS */}
      <EmailService />

      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main nav */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-church-primary" />
                <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">
                  NBCC LMS
                </span>
              </div>

              {/* Desktop navigation */}
              {showUserInfo && (
                <div className="hidden md:ml-6 md:flex md:space-x-8">
                  <button
                    onClick={handleDashboardClick}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      (router.pathname === '/dashboard' || router.pathname === '/admin')
                        ? 'border-church-primary text-church-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Home className="h-4 w-4 mr-1" />
                    Dashboard
                  </button>
                  <button
                    onClick={handleStudyMaterialsClick}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      (router.pathname.startsWith('/sections') || router.pathname === '/admin/upload')
                        ? 'border-church-primary text-church-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Study Materials
                  </button>
                  <button
                    onClick={handleSermonsClick}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      (router.pathname.startsWith('/sermons') || router.pathname.startsWith('/admin/sermons'))
                        ? 'border-church-primary text-church-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Sermons
                  </button>
                  <button
                    onClick={handleAgreementClick}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      (router.pathname === '/agreement' || router.pathname.startsWith('/admin/agreements'))
                        ? 'border-church-primary text-church-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Agreement
                  </button>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center">
              {showUserInfo ? (
                <div className="flex items-center space-x-4">
                  <span className="hidden md:block text-sm text-gray-700">
                    Welcome, {user.user_metadata?.full_name || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/auth/register')}
                    className="bg-church-primary hover:bg-church-secondary text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              {showUserInfo && (
                <div className="md:hidden ml-4">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  >
                    {mobileMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {showUserInfo && mobileMenuOpen && (
          <div className="md:hidden">
            {/* User info for mobile */}
            {user && (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="px-4">
                  <div className="text-base font-medium text-gray-800 truncate">
                    {user.user_metadata?.full_name || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 pb-3 space-y-1">
              <button
                onClick={() => {
                  handleDashboardClick()
                  setMobileMenuOpen(false)
                }}
                className={`block pl-3 pr-4 py-4 border-l-4 text-base font-medium w-full text-left min-h-[44px] transition-colors duration-200 ${
                  (router.pathname === '/dashboard' || router.pathname === '/admin')
                    ? 'border-church-primary text-church-primary bg-church-primary bg-opacity-10'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Home className="h-5 w-5 inline mr-3" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  handleStudyMaterialsClick()
                  setMobileMenuOpen(false)
                }}
                className={`block pl-3 pr-4 py-4 border-l-4 text-base font-medium w-full text-left min-h-[44px] transition-colors duration-200 ${
                  (router.pathname.startsWith('/sections') || router.pathname === '/admin/upload')
                    ? 'border-church-primary text-church-primary bg-church-primary bg-opacity-10'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="h-5 w-5 inline mr-3" />
                Study Materials
              </button>
              <button
                onClick={() => {
                  handleSermonsClick()
                  setMobileMenuOpen(false)
                }}
                className={`block pl-3 pr-4 py-4 border-l-4 text-base font-medium w-full text-left min-h-[44px] transition-colors duration-200 ${
                  (router.pathname.startsWith('/sermons') || router.pathname.startsWith('/admin/sermons'))
                    ? 'border-church-primary text-church-primary bg-church-primary bg-opacity-10'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="h-5 w-5 inline mr-3" />
                Sermons
              </button>
              <button
                onClick={() => {
                  handleAgreementClick()
                  setMobileMenuOpen(false)
                }}
                className={`block pl-3 pr-4 py-4 border-l-4 text-base font-medium w-full text-left min-h-[44px] transition-colors duration-200 ${
                  (router.pathname === '/agreement' || router.pathname.startsWith('/admin/agreements'))
                    ? 'border-church-primary text-church-primary bg-church-primary bg-opacity-10'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-5 w-5 inline mr-3" />
                Agreement
              </button>

              {/* Mobile sign out */}
              {user && (
                <button
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                  className="block pl-3 pr-4 py-4 border-l-4 text-base font-medium w-full text-left min-h-[44px] border-transparent text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5 inline mr-3" />
                  Sign Out
                </button>
              )}

              {/* Mobile auth buttons for guests */}
              {!user && (
                <>
                  <button
                    onClick={() => {
                      router.push('/auth/login')
                      setMobileMenuOpen(false)
                    }}
                    className="block pl-3 pr-4 py-4 border-l-4 text-base font-medium w-full text-left min-h-[44px] border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      router.push('/auth/register')
                      setMobileMenuOpen(false)
                    }}
                    className="block pl-3 pr-4 py-4 border-l-4 text-base font-medium w-full text-left min-h-[44px] border-church-primary text-church-primary bg-church-primary bg-opacity-10 transition-colors duration-200"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {!supabase && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <DemoNotification />
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed">
              © 2025 New Bridge Community Church Learning Management System
            </div>
            <div className="text-xs text-gray-500 leading-relaxed">
              Built with love for our church community • Powered by faith and technology
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
