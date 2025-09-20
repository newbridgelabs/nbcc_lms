import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Get user's assigned journeys from the new user_journeys table
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
          description,
          is_active,
          journey_days (
            id,
            day_number,
            title,
            content,
            scripture_reference,
            reflection_questions
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('journey_order')

    if (journeysError) {
      console.error('Error fetching user journeys:', journeysError)
      return res.status(500).json({ error: 'Failed to fetch user journeys' })
    }

    // If no journeys assigned, check if user has tags and try to find default journeys
    if (!userJourneys || userJourneys.length === 0) {
      // Get user's tags for backward compatibility
      const { data: userTags, error: tagsError } = await supabase
        .from('user_tags')
        .select('tag_name')
        .eq('user_id', userId)

      if (tagsError) {
        console.error('Error fetching user tags:', tagsError)
      }

      // For backward compatibility, try to find a journey based on the first tag
      if (userTags && userTags.length > 0) {
        const firstTag = userTags[0].tag_name

        const { data: defaultJourneys, error: defaultJourneyError } = await supabase
          .from('journeys')
          .select(`
            *,
            journey_days (
              id,
              day_number,
              title,
              content,
              scripture_reference,
              reflection_questions
            )
          `)
          .eq('user_tag', firstTag)
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        if (!defaultJourneyError && defaultJourneys && defaultJourneys.length > 0) {
          return res.status(200).json({
            success: true,
            journeys: defaultJourneys,
            isDefault: true
          })
        }
      }

      return res.status(404).json({ error: 'No journeys assigned to user' })
    }

    // Filter out inactive journeys and format response
    const activeJourneys = userJourneys
      .filter(uj => uj.journeys && uj.journeys.is_active)
      .map(uj => ({
        ...uj.journeys,
        journey_order: uj.journey_order,
        assigned_at: uj.assigned_at
      }))

    // Determine which journey the user should be on (first incomplete journey)
    let currentJourney = null
    let allProgress = []

    // Get progress for all assigned journeys
    for (const journey of activeJourneys) {
      const { data: journeyProgress, error: progressError } = await supabase
        .from('user_journey_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('journey_id', journey.id)

      if (progressError) {
        console.error('Error fetching progress:', progressError)
        continue
      }

      allProgress.push(...(journeyProgress || []))

      // Check if this journey is completed
      const completedDays = journeyProgress?.filter(p => p.completed).length || 0
      const totalDays = journey.journey_days?.length || 0
      const isCompleted = completedDays === totalDays && totalDays > 0

      // If no current journey set, or this journey is not completed, use this one
      if (!currentJourney || !isCompleted) {
        currentJourney = journey
        if (!isCompleted) break // Stop at first incomplete journey
      }
    }

    if (!currentJourney) {
      return res.status(404).json({ error: 'No available journey found' })
    }

    // Get user's progress for the current journey
    const progress = allProgress.filter(p => p.journey_id === currentJourney.id)

    // Sort journey days by day_number
    if (currentJourney.journey_days) {
      currentJourney.journey_days.sort((a, b) => a.day_number - b.day_number)
    }

    // Add progress information to each day
    const daysWithProgress = currentJourney.journey_days.map(day => {
      const dayProgress = progress.find(p => p.day_id === day.id)
      return {
        ...day,
        completed: dayProgress?.completed || false,
        reflection_answers: dayProgress?.reflection_answers || null,
        completed_at: dayProgress?.completed_at || null
      }
    })

    // Check if there are other journeys available
    const completedJourneys = []
    const availableJourneys = []

    for (const journey of activeJourneys) {
      const journeyProgress = allProgress.filter(p => p.journey_id === journey.id)
      const completedDays = journeyProgress.filter(p => p.completed).length
      const totalDays = journey.journey_days?.length || 0
      const isCompleted = completedDays === totalDays && totalDays > 0

      if (isCompleted) {
        completedJourneys.push(journey)
      } else if (journey.id !== currentJourney.id) {
        availableJourneys.push(journey)
      }
    }

    return res.status(200).json({
      success: true,
      journey: {
        ...currentJourney,
        journey_days: daysWithProgress
      },
      progress: {
        completedDays: progress.filter(p => p.completed).length,
        totalDays: currentJourney.journey_days.length,
        progressPercentage: Math.round((progress.filter(p => p.completed).length / currentJourney.journey_days.length) * 100)
      },
      completedJourneys,
      availableJourneys,
      allAssignedJourneys: activeJourneys
    })

  } catch (error) {
    console.error('Error in user-journey API:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}
