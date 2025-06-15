import { createClient } from '@supabase/supabase-js'
import { checkAdminAccessAPI } from '../../../lib/admin-config'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify admin access
    const { user, error: authError } = await checkAdminAccessAPI(req)
    if (authError || !user) {
      return res.status(401).json({ error: authError || 'Unauthorized' })
    }

    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Use admin API to list users and check if email exists
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return res.status(500).json({ 
        error: `Failed to check user existence: ${listError.message}`,
        exists: false
      })
    }

    // Check if user exists in auth.users
    const userExists = users.users.some(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    )

    return res.status(200).json({
      success: true,
      exists: userExists,
      email: email.toLowerCase()
    })

  } catch (error) {
    console.error('Error in check-auth-user:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      exists: false
    })
  }
}
