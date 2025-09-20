import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  try {
    // Get all journeys with their days count
    const { data: journeys, error } = await supabase
      .from('journeys')
      .select(`
        *,
        journey_days (
          id,
          day_number,
          title
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching journeys:', error)
      return res.status(500).json({ error: 'Failed to fetch journeys' })
    }

    // Add stats to each journey
    const journeysWithStats = journeys.map(journey => ({
      ...journey,
      days_count: journey.journey_days?.length || 0,
      journey_days: journey.journey_days?.sort((a, b) => a.day_number - b.day_number)
    }))

    return res.status(200).json({
      success: true,
      journeys: journeysWithStats
    })

  } catch (error) {
    console.error('Error in journeys API:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}
