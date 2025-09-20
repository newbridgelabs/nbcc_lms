import { supabase } from '../../../lib/supabase'
import { checkAdminAccess } from '../../../lib/admin-config'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check admin access
    const { user, isAdmin } = await checkAdminAccess(req, res)
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Get all users with their basic info
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        user_tag,
        created_at,
        is_admin,
        user_tags (
          tag_name,
          is_active
        )
      `)
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // Format the data
    const formattedUsers = (users || []).map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_admin: user.is_admin,
      created_at: user.created_at,
      tags: user.user_tags?.filter(ut => ut.is_active).map(ut => ut.tag_name) || [user.user_tag].filter(Boolean),
      // Note: Passwords are managed by Supabase Auth and cannot be retrieved
      // Users need to use "Forgot Password" feature to reset their passwords
      password_note: "Passwords are securely managed by Supabase Auth. Use 'Forgot Password' to reset."
    }))

    // Get some sample test credentials info
    const testInfo = {
      note: "For testing purposes, you can:",
      options: [
        "1. Use the 'Forgot Password' feature on the login page to reset any user's password",
        "2. Create new test users through the 'Allowed Users' section",
        "3. Use your admin account to test admin features",
        "4. Ask users to share their login credentials for testing (not recommended for production)"
      ],
      admin_account: {
        email: user.email,
        note: "This is your current admin account - you're already logged in with it"
      }
    }

    res.status(200).json({ 
      success: true,
      users: formattedUsers,
      testing_info: testInfo,
      total_users: formattedUsers.length
    })

  } catch (error) {
    console.error('Error getting user info:', error)
    res.status(500).json({ 
      error: 'Failed to get user info', 
      details: error.message 
    })
  }
}
