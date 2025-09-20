import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  try {
    const { method } = req

    switch (method) {
      case 'GET':
        return await getUserTags(req, res)
      case 'POST':
        return await updateUserTags(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getUserTags(req, res) {
  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    // Get user's current tags
    const { data: userTags, error: tagsError } = await supabase
      .from('user_tags')
      .select('tag_name')
      .eq('user_id', userId)

    if (tagsError) throw tagsError

    // Get all available tag options
    const availableTags = [
      'newcomer',
      'existing_member', 
      'worship_team',
      'admin',
      'volunteer',
      'usher',
      'sunday_school',
      'media',
      'social_media',
      'nbcc_labs'
    ]

    return res.status(200).json({
      success: true,
      userTags: userTags?.map(t => t.tag_name) || [],
      availableTags
    })
  } catch (error) {
    console.error('Error fetching user tags:', error)
    return res.status(500).json({ error: 'Failed to fetch user tags' })
  }
}

async function updateUserTags(req, res) {
  const { userId, tags } = req.body

  if (!userId || !Array.isArray(tags)) {
    return res.status(400).json({ error: 'User ID and tags array are required' })
  }

  try {
    // Remove all existing tags for this user
    const { error: deleteError } = await supabase
      .from('user_tags')
      .delete()
      .eq('user_id', userId)

    if (deleteError) throw deleteError

    // Add new tags
    if (tags.length > 0) {
      const tagInserts = tags.map(tag => ({
        user_id: userId,
        tag_name: tag
      }))

      const { error: insertError } = await supabase
        .from('user_tags')
        .insert(tagInserts)

      if (insertError) throw insertError
    }

    return res.status(200).json({
      success: true,
      message: 'User tags updated successfully'
    })
  } catch (error) {
    console.error('Error updating user tags:', error)
    return res.status(500).json({ error: 'Failed to update user tags' })
  }
}
