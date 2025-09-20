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

    if (req.method === 'GET') {
      // Get user's responses for this sermon
      const { data: responses, error } = await supabase
        .from('sermon_responses')
        .select(`
          *,
          sermon_questions (
            id,
            question_text,
            question_order,
            is_private,
            placeholder_text
          )
        `)
        .eq('user_id', user.id)
        .eq('sermon_id', sermonId)
        .order('sermon_questions(question_order)', { ascending: true })

      if (error) {
        console.error('Error fetching responses:', error)
        throw error
      }

      return res.status(200).json({ responses })
    }

    if (req.method === 'POST') {
      // Save/update user response
      const { question_id, response_text } = req.body

      if (!question_id) {
        return res.status(400).json({ error: 'Question ID is required' })
      }

      // First check if response exists
      const { data: existingResponse, error: checkError } = await supabase
        .from('sermon_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('sermon_id', sermonId)
        .eq('question_id', question_id)
        .single()

      let result
      if (existingResponse) {
        // Update existing response
        const { data, error } = await supabase
          .from('sermon_responses')
          .update({
            response_text: response_text || '',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('sermon_id', sermonId)
          .eq('question_id', question_id)
          .select()
          .single()

        if (error) {
          console.error('Error updating response:', error)
          throw error
        }
        result = data
      } else {
        // Insert new response
        const { data, error } = await supabase
          .from('sermon_responses')
          .insert({
            user_id: user.id,
            sermon_id: sermonId,
            question_id,
            response_text: response_text || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          console.error('Error inserting response:', error)
          throw error
        }
        result = data
      }

      return res.status(200).json({ response: result })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Sermon responses API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
