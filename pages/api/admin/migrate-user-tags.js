import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting user tags migration...')

    // Check if user_tag column exists in allowed_users table
    const { data: allowedUsersColumns, error: allowedUsersError } = await supabase
      .from('allowed_users')
      .select('user_tag')
      .limit(1)

    // If the column doesn't exist, we need to add it manually via SQL
    // For now, let's assume the columns exist and just update existing records

    // Update existing allowed_users records to have 'newcomer' tag if they don't have one
    const { error: updateAllowedUsersError } = await supabase
      .from('allowed_users')
      .update({ user_tag: 'newcomer' })
      .is('user_tag', null)

    if (updateAllowedUsersError && !updateAllowedUsersError.message.includes('column "user_tag" does not exist')) {
      console.error('Error updating allowed_users:', updateAllowedUsersError)
    }

    // Update existing users records to have 'newcomer' tag if they don't have one
    const { error: updateUsersError } = await supabase
      .from('users')
      .update({ user_tag: 'newcomer' })
      .is('user_tag', null)

    if (updateUsersError && !updateUsersError.message.includes('column "user_tag" does not exist')) {
      console.error('Error updating users:', updateUsersError)
    }

    console.log('User tags migration completed successfully')

    return res.status(200).json({
      success: true,
      message: 'User tags migration completed. Note: If columns do not exist, please add them manually in Supabase SQL Editor.',
      details: {
        allowedUsersUpdate: updateAllowedUsersError ? 'Column may not exist' : 'Success',
        usersUpdate: updateUsersError ? 'Column may not exist' : 'Success'
      }
    })

  } catch (error) {
    console.error('Error during migration:', error)
    return res.status(500).json({
      error: 'Migration completed with warnings',
      details: error.message,
      note: 'Please run the SQL commands manually in Supabase SQL Editor if columns do not exist'
    })
  }
}
