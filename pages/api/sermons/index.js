import { createClient } from '@supabase/supabase-js'
import { checkAdminStatus } from '../../../lib/admin-config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  try {
    // Get user from session cookie or auth header (for authenticated requests)
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

    if (req.method === 'GET') {
      // Get all active sermons
      const { data: sermons, error } = await supabase
        .from('sermons')
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
        .eq('is_active', true)
        .order('sermon_date', { ascending: false })
        .order('question_order', { foreignTable: 'sermon_questions', ascending: true })

      if (error) {
        throw error
      }

      return res.status(200).json({ sermons })
    }

    if (req.method === 'POST') {
      // Create new sermon (admin only)
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const isAdmin = await checkAdminStatus(user.id, user.email)
      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const {
        title,
        description,
        sermon_date,
        pastor_name,
        scripture_reference,
        questions = []
      } = req.body

      if (!title || !sermon_date) {
        return res.status(400).json({ error: 'Title and sermon date are required' })
      }

      // Create sermon
      const { data: sermon, error: sermonError } = await supabase
        .from('sermons')
        .insert({
          title,
          description,
          sermon_date,
          pastor_name,
          scripture_reference,
          created_by: user.id
        })
        .select()
        .single()

      if (sermonError) {
        throw sermonError
      }

      // Create questions if provided
      if (questions.length > 0) {
        const questionsToInsert = questions.map((q, index) => ({
          sermon_id: sermon.id,
          question_text: q.question_text,
          question_order: index + 1,
          is_private: q.is_private !== false, // default to private
          placeholder_text: q.placeholder_text || ''
        }))

        const { error: questionsError } = await supabase
          .from('sermon_questions')
          .insert(questionsToInsert)

        if (questionsError) {
          throw questionsError
        }
      }

      // Fetch complete sermon with questions
      const { data: completeSermon, error: fetchError } = await supabase
        .from('sermons')
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
        .eq('id', sermon.id)
        .order('question_order', { foreignTable: 'sermon_questions', ascending: true })
        .single()

      if (fetchError) {
        throw fetchError
      }

      return res.status(201).json({ sermon: completeSermon })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Sermons API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
