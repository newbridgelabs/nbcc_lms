import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting migration of existing user tags...')

    // Get all users with their current user_tag
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, user_tag')
      .not('user_tag', 'is', null)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    console.log(`Found ${users?.length || 0} users with tags to migrate`)

    // Migrate each user's tag to the new user_tags table
    for (const user of users || []) {
      if (user.user_tag) {
        try {
          // Check if tag already exists for this user
          const { data: existingTag } = await supabase
            .from('user_tags')
            .select('id')
            .eq('user_id', user.id)
            .eq('tag_name', user.user_tag)
            .single()

          if (!existingTag) {
            // Insert the tag into user_tags table
            const { error: insertError } = await supabase
              .from('user_tags')
              .insert({
                user_id: user.id,
                tag_name: user.user_tag,
                assigned_at: new Date().toISOString(),
                is_active: true
              })

            if (insertError) {
              console.error(`Error inserting tag for user ${user.id}:`, insertError)
            } else {
              console.log(`Migrated tag '${user.user_tag}' for user ${user.id}`)
            }
          } else {
            console.log(`Tag '${user.user_tag}' already exists for user ${user.id}`)
          }
        } catch (error) {
          console.error(`Error processing user ${user.id}:`, error)
        }
      }
    }

    // Also migrate allowed_users tags
    const { data: allowedUsers, error: allowedUsersError } = await supabase
      .from('allowed_users')
      .select('id, email, user_tag')
      .not('user_tag', 'is', null)

    if (allowedUsersError) {
      console.error('Error fetching allowed users:', allowedUsersError)
    } else {
      console.log(`Found ${allowedUsers?.length || 0} allowed users with tags`)
      
      // For allowed users, we'll store their tags for when they register
      for (const allowedUser of allowedUsers || []) {
        console.log(`Allowed user ${allowedUser.email} has tag: ${allowedUser.user_tag}`)
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully migrated tags for ${users?.length || 0} users`,
      migratedUsers: users?.length || 0,
      allowedUsers: allowedUsers?.length || 0
    })

  } catch (error) {
    console.error('Migration error:', error)
    return res.status(500).json({
      success: false,
      error: 'Migration failed: ' + error.message
    })
  }
}
