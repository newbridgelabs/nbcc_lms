import { createClient } from '@supabase/supabase-js'
import { checkAdminStatus } from '../../../../lib/admin-config'

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

    // Check admin access
    const isAdmin = await checkAdminStatus(user.id, user.email)
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { id: sermonId } = req.query

    if (req.method === 'GET') {
      // Get total participants
      const { count: totalParticipants, error: participantsError } = await supabase
        .from('sermon_participation')
        .select('*', { count: 'exact', head: true })
        .eq('sermon_id', sermonId)

      if (participantsError) {
        console.error('Error counting participants:', participantsError)
        throw participantsError
      }

      // Get completed participants
      const { count: completedParticipants, error: completedError } = await supabase
        .from('sermon_participation')
        .select('*', { count: 'exact', head: true })
        .eq('sermon_id', sermonId)
        .not('completed_at', 'is', null)

      if (completedError) {
        console.error('Error counting completed participants:', completedError)
        throw completedError
      }

      // Get total responses
      const { count: totalResponses, error: responsesError } = await supabase
        .from('sermon_responses')
        .select('*', { count: 'exact', head: true })
        .eq('sermon_id', sermonId)

      if (responsesError) {
        console.error('Error counting responses:', responsesError)
        throw responsesError
      }

      // Get public questions count
      const { count: publicQuestions, error: questionsError } = await supabase
        .from('sermon_public_questions')
        .select('*', { count: 'exact', head: true })
        .eq('sermon_id', sermonId)

      if (questionsError) {
        console.error('Error counting public questions:', questionsError)
        throw questionsError
      }

      return res.status(200).json({
        stats: {
          totalParticipants: totalParticipants || 0,
          completedParticipants: completedParticipants || 0,
          totalResponses: totalResponses || 0,
          publicQuestions: publicQuestions || 0
        }
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Sermon stats API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
} 