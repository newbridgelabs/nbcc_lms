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

      // Upsert response
      const { data: response, error } = await supabase
        .from('sermon_responses')
        .upsert({
          user_id: user.id,
          sermon_id: sermonId,
          question_id,
          response_text: response_text || ''
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return res.status(200).json({ response })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Sermon responses API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
