import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  try {
    // Get user from session cookie or auth header
    const authHeader = req.headers.authorization
    const sessionCookie = req.cookies['sb-access-token'] || req.cookies['supabase-auth-token']
    let token = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (sessionCookie) {
      // Handle both JSON and string tokens
      if (typeof sessionCookie === 'string' && sessionCookie.startsWith('{')) {
        try {
          const parsedCookie = JSON.parse(sessionCookie)
          token = parsedCookie.access_token || parsedCookie[0]?.access_token
        } catch (e) {
          console.warn('Failed to parse session cookie as JSON:', e)
          token = sessionCookie
        }
      } else if (Array.isArray(sessionCookie) && sessionCookie[0]?.access_token) {
        token = sessionCookie[0].access_token
      } else {
        token = sessionCookie
      }
    }

    if (!token) {
      console.error('No auth token found:', { authHeader: !!authHeader, sessionCookie: !!sessionCookie })
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Get user from token
    let user
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token)
    user = authUser
    
    if (userError) {
      console.error('Auth error:', userError)
      // Try to refresh the session if token is expired
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !session?.user) {
      return res.status(401).json({ error: 'Invalid authentication' })
      }
      user = session.user
    }

    if (!user) {
      return res.status(401).json({ error: 'No user found' })
    }

    const { id: sermonId } = req.query

    if (!sermonId) {
      return res.status(400).json({ error: 'Sermon ID is required' })
    }

    if (req.method === 'GET') {
      // Get user's participation status for this sermon
      const { data: participation, error } = await supabase
        .from('sermon_participation')
        .select('*')
        .eq('user_id', user.id)
        .eq('sermon_id', sermonId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching participation:', error)
        throw error
      }

      return res.status(200).json({ participation })
    }

    if (req.method === 'POST') {
      // Start or update participation
      const { current_question_index, completed, question_text } = req.body

      // If question_text is provided, save it as a public question
      if (question_text) {
        try {
          const { error: questionError } = await supabase
            .from('sermon_public_questions')
            .insert({
              sermon_id: sermonId,
              user_id: user.id,
              question_text: question_text.trim(),
              created_at: new Date().toISOString()
            })

          if (questionError) {
            console.error('Error saving question:', questionError)
            throw questionError
          }
        } catch (questionError) {
          console.error('Failed to save question:', questionError)
          return res.status(500).json({ error: 'Failed to save question: ' + questionError.message })
        }
      }

      // Update participation status
      const updateData = {
        user_id: user.id,
        sermon_id: sermonId,
        current_question_index: current_question_index || 0
      }

      // Only add updated_at if the column exists (for backward compatibility)
      try {
        updateData.updated_at = new Date().toISOString()
      } catch (e) {
        console.warn('updated_at column might not exist yet:', e)
      }

      if (completed) {
        updateData.completed_at = new Date().toISOString()
      }

      try {
        // First check if a record exists
        const { data: existingRecord, error: checkError } = await supabase
          .from('sermon_participation')
          .select('*')
          .eq('user_id', user.id)
          .eq('sermon_id', sermonId)
          .single()

        let result
        if (existingRecord) {
          // Update existing record
          const { data, error } = await supabase
            .from('sermon_participation')
            .update(updateData)
            .eq('user_id', user.id)
            .eq('sermon_id', sermonId)
            .select()
            .single()

          if (error) {
            console.error('Error updating participation:', error)
            throw error
          }
          result = data
        } else {
          // Insert new record
          const { data, error } = await supabase
            .from('sermon_participation')
            .insert({
              ...updateData,
              started_at: new Date().toISOString()
            })
            .select()
            .single()

          if (error) {
            console.error('Error inserting participation:', error)
            throw error
          }
          result = data
        }

        return res.status(200).json({ participation: result })
      } catch (participationError) {
        console.error('Failed to update participation:', participationError)
        return res.status(500).json({ error: 'Failed to update participation: ' + participationError.message })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Participation API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
