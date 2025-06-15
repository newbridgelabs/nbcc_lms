import { createClient } from '@supabase/supabase-js'

// This API endpoint uses the service role key to delete users from auth.users
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    console.log('=== AUTH USER CLEANUP ===')
    console.log('Target email:', email)

    // Create admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ 
        error: 'Supabase configuration missing. Service role key required for auth user deletion.' 
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Step 1: Find the user in auth.users by email
    console.log('Searching for user in auth.users...')
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return res.status(500).json({ 
        error: `Failed to list users: ${listError.message}` 
      })
    }

    const targetUser = users.users.find(user => user.email?.toLowerCase() === email.toLowerCase())

    if (!targetUser) {
      console.log('User not found in auth.users')
      return res.status(200).json({ 
        success: true,
        message: 'User not found in auth.users (already clean)',
        userFound: false
      })
    }

    console.log('User found in auth.users:', {
      id: targetUser.id,
      email: targetUser.email,
      created_at: targetUser.created_at,
      email_confirmed_at: targetUser.email_confirmed_at
    })

    // Step 2: Delete the user from auth.users
    console.log('Deleting user from auth.users...')
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return res.status(500).json({ 
        error: `Failed to delete user: ${deleteError.message}` 
      })
    }

    console.log('✅ User successfully deleted from auth.users')

    // Step 3: Clean up related data in custom tables
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Clean up custom users table
    const { error: customDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', email.toLowerCase())

    if (customDeleteError && customDeleteError.code !== 'PGRST116') {
      console.warn('Could not delete from custom users table:', customDeleteError.message)
    } else {
      console.log('✅ Cleaned up custom users table')
    }

    // Reset allowed_users status
    const { error: resetError } = await supabase
      .from('allowed_users')
      .update({ 
        is_used: false,
        reset_at: new Date().toISOString(),
        reset_reason: 'Auth user cleanup'
      })
      .eq('email', email.toLowerCase())

    if (resetError) {
      console.warn('Could not reset allowed_users:', resetError.message)
    } else {
      console.log('✅ Reset allowed_users status')
    }

    return res.status(200).json({
      success: true,
      message: 'User successfully cleaned up from all systems',
      userFound: true,
      deletedUserId: targetUser.id,
      actions: [
        'Deleted from auth.users',
        'Cleaned up custom users table',
        'Reset allowed_users status'
      ]
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return res.status(500).json({ 
      error: `Cleanup failed: ${error.message}` 
    })
  }
}
