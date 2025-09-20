import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  try {
    const { method } = req

    switch (method) {
      case 'GET':
        return await getUserJourneys(req, res)
      case 'POST':
        return await updateUserJourneys(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getUserJourneys(req, res) {
  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    // Get user's current journeys with details
    const { data: userJourneys, error: journeysError } = await supabase
      .from('user_journeys')
      .select(`
        journey_id,
        journey_order,
        is_active,
        assigned_at,
        journeys (
          id,
          title,
          description
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('journey_order')

    if (journeysError) throw journeysError

    // Get all available journeys
    const { data: allJourneys, error: allJourneysError } = await supabase
      .from('journeys')
      .select('id, title, description')
      .eq('is_active', true)
      .order('title')

    if (allJourneysError) throw allJourneysError

    return res.status(200).json({
      success: true,
      userJourneys: userJourneys || [],
      availableJourneys: allJourneys || []
    })
  } catch (error) {
    console.error('Error fetching user journeys:', error)
    return res.status(500).json({ error: 'Failed to fetch user journeys' })
  }
}

async function updateUserJourneys(req, res) {
  const { userId, journeys, assignedBy } = req.body

  if (!userId || !Array.isArray(journeys)) {
    return res.status(400).json({ error: 'User ID and journeys array are required' })
  }

  try {
    // Remove all existing journey assignments for this user
    const { error: deleteError } = await supabase
      .from('user_journeys')
      .delete()
      .eq('user_id', userId)

    if (deleteError) throw deleteError

    // Add new journey assignments
    if (journeys.length > 0) {
      const journeyInserts = journeys.map((journey, index) => ({
        user_id: userId,
        journey_id: journey.journey_id,
        journey_order: journey.order || index + 1,
        assigned_by: assignedBy,
        is_active: true
      }))

      const { error: insertError } = await supabase
        .from('user_journeys')
        .insert(journeyInserts)

      if (insertError) throw insertError
    }

    return res.status(200).json({
      success: true,
      message: 'User journeys updated successfully'
    })
  } catch (error) {
    console.error('Error updating user journeys:', error)
    return res.status(500).json({ error: 'Failed to update user journeys' })
  }
}
