import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, dayId, reflectionAnswers } = req.body

    if (!userId || !dayId) {
      return res.status(400).json({ error: 'User ID and Day ID are required' })
    }

    // Get the journey_id for this day
    const { data: dayData, error: dayError } = await supabase
      .from('journey_days')
      .select('journey_id')
      .eq('id', dayId)
      .single()

    if (dayError) {
      console.error('Error fetching day data:', dayError)
      return res.status(500).json({ error: 'Failed to fetch day data' })
    }

    // Check if progress record already exists
    const { data: existingProgress, error: checkError } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('day_id', dayId)
      .single()

    let result
    if (existingProgress) {
      // Update existing record
      const { data, error } = await supabase
        .from('user_journey_progress')
        .update({
          completed: true,
          reflection_answers: reflectionAnswers || null,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('day_id', dayId)
        .select()
      
      if (error) {
        console.error('Update error:', error)
        throw error
      }
      result = data
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('user_journey_progress')
        .insert({
          user_id: userId,
          journey_id: dayData.journey_id,
          day_id: dayId,
          completed: true,
          reflection_answers: reflectionAnswers || null,
          completed_at: new Date().toISOString()
        })
        .select()
      
      if (error) {
        console.error('Insert error:', error)
        throw error
      }
      result = data
    }

    console.log('Journey day completed successfully:', result)

    return res.status(200).json({
      success: true,
      data: result[0]
    })

  } catch (error) {
    console.error('Journey day completion error:', error)
    return res.status(500).json({ 
      error: 'Failed to complete journey day', 
      details: error.message 
    })
  }
}
