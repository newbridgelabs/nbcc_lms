import { supabase } from './supabase'

// ===== ADMIN CONFIGURATION =====
// Add admin emails here - this is the ONLY place you need to update
export const ADMIN_EMAILS = [
  'admin@nbcc.com',
  'pastor@nbcc.com', 
  'mppaul1458@gmail.com',  // Your email
  // Add more admin emails here as needed
]

// Admin registration code - change this for production
export const ADMIN_REGISTRATION_CODE = 'NBCC2025ADMIN'

// ===== ADMIN UTILITY FUNCTIONS =====

/**
 * Check if a user has admin privileges
 * This function checks both database role and email-based fallback
 */
export const checkAdminStatus = async (userId, email) => {
  try {
    // First, check if user is admin in the database
    const { data: userData, error } = await supabase
      .from('users')
      .select('is_admin, role')
      .eq('id', userId)
      .single()

    if (!error && userData) {
      // If database check succeeds, use database values
      const isAdminInDB = userData.is_admin === true || userData.role === 'admin'
      if (isAdminInDB) {
        return true
      }
    }

    // Fallback to email-based check if database check fails or returns false
    const isAdminByEmail = ADMIN_EMAILS.includes(email.toLowerCase()) || 
                          email.toLowerCase().includes('admin') || 
                          email.toLowerCase().includes('pastor')
    
    // If user is admin by email but not in database, update database
    if (isAdminByEmail && userId) {
      try {
        await supabase
          .from('users')
          .upsert({ 
            id: userId,
            email: email,
            is_admin: true,
            role: 'admin'
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
        console.log('Updated admin status in database for:', email)
      } catch (updateError) {
        console.warn('Could not update admin status in database:', updateError.message)
      }
    }

    return isAdminByEmail
  } catch (error) {
    console.warn('Admin status check failed:', error.message)
    
    // Final fallback to email-based check
    return ADMIN_EMAILS.includes(email.toLowerCase()) || 
           email.toLowerCase().includes('admin') || 
           email.toLowerCase().includes('pastor')
  }
}

/**
 * Centralized admin access check for pages
 * Use this in all admin pages for consistent behavior
 */
export const checkAdminAccess = async (router, setUser = null, setLoading = null) => {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      router.push('/auth/login')
      return { isAdmin: false, user: null }
    }

    const isAdmin = await checkAdminStatus(currentUser.id, currentUser.email)
    
    if (!isAdmin) {
      console.log('Access denied for user:', currentUser.email)
      console.log('Admin emails:', ADMIN_EMAILS)
      
      // Show more detailed error message
      const toast = (await import('react-hot-toast')).default
      toast.error(`Access denied. Admin privileges required. Contact administrator to add ${currentUser.email} to admin list.`)
      router.push('/dashboard')
      return { isAdmin: false, user: currentUser }
    }

    if (setUser) setUser(currentUser)
    return { isAdmin: true, user: currentUser }
  } catch (error) {
    console.error('Error checking admin access:', error)
    router.push('/auth/login')
    return { isAdmin: false, user: null }
  } finally {
    if (setLoading) setLoading(false)
  }
}

/**
 * Check if an email is in the admin list
 */
export const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email.toLowerCase()) || 
         email.toLowerCase().includes('admin') || 
         email.toLowerCase().includes('pastor')
}

/**
 * Get all admin emails (for display purposes)
 */
export const getAdminEmails = () => {
  return [...ADMIN_EMAILS]
}

/**
 * Check admin access for API routes
 * Use this in API endpoints that require admin privileges
 */
export const checkAdminAccessAPI = async (req) => {
  try {
    console.log('Checking admin access for API route')

    // Get the authorization header
    const authHeader = req.headers.authorization
    console.log('Auth header present:', !!authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header found')
      return { user: null, error: 'No authorization token provided' }
    }

    const token = authHeader.split(' ')[1]
    console.log('Token extracted, length:', token?.length)

    // Create a temporary supabase client to verify the token
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseTemp = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Verify the JWT token
    console.log('Verifying JWT token...')
    const { data: { user }, error: userError } = await supabaseTemp.auth.getUser(token)

    if (userError) {
      console.log('Token verification failed:', userError.message)
      return { user: null, error: `Invalid or expired token: ${userError.message}` }
    }

    if (!user) {
      console.log('No user found from token')
      return { user: null, error: 'Invalid or expired token' }
    }

    console.log('User verified:', user.email)

    // Check if user has admin privileges
    const isAdmin = await checkAdminStatus(user.id, user.email)
    console.log('Admin status:', isAdmin)

    if (!isAdmin) {
      console.log('User does not have admin privileges')
      return { user: null, error: 'Admin privileges required' }
    }

    console.log('Admin access granted')
    return { user, error: null }
  } catch (error) {
    console.error('API admin access check failed:', error)
    return { user: null, error: `Authentication failed: ${error.message}` }
  }
}
