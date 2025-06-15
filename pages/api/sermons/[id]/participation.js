import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  try {
    // Get user from session cookie or auth header
    const authHeader = req.headers.authorization
    const sessionCookie = req.cookies['sb-access-token'] || req.cookies['supabase-auth-token']

    let user = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token)
      if (!error) user = authUser
    } else if (sessionCookie) {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(sessionCookie)
      if (!error) user = authUser
    }

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { id: sermonId } = req.query

    if (req.method === 'GET') {
      // Get user's participation status for this sermon
      const { data: participation, error } = await supabase
        .from('sermon_participation')
        .select('*')
        .eq('user_id', user.id)
        .eq('sermon_id', sermonId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return res.status(200).json({ participation })
    }

    if (req.method === 'POST') {
      // Start or update participation
      const { current_question_index, completed } = req.body

      const updateData = {
        user_id: user.id,
        sermon_id: sermonId,
        current_question_index: current_question_index || 0
      }

      if (completed) {
        updateData.completed_at = new Date().toISOString()
      }

      const { data: participation, error } = await supabase
        .from('sermon_participation')
        .upsert(updateData)
        .select()
        .single()

      if (error) {
        throw error
      }

      return res.status(200).json({ participation })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Participation API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
