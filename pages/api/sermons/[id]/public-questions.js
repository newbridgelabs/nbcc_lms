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
      const isAdmin = await checkAdminStatus(user.id, user.email)
      
      if (isAdmin) {
        // Admin view: Get all public questions (anonymously)
        const { data: questions, error } = await supabase
          .from('sermon_public_questions')
          .select(`
            id,
            question_text,
            is_answered,
            admin_response,
            created_at
          `)
          .eq('sermon_id', sermonId)
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        return res.status(200).json({ questions })
      } else {
        // User view: Get only their own questions
        const { data: questions, error } = await supabase
          .from('sermon_public_questions')
          .select('*')
          .eq('sermon_id', sermonId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (error) {
          throw error
        }

        return res.status(200).json({ questions })
      }
    }

    if (req.method === 'POST') {
      // Submit public question
      const { question_text } = req.body

      if (!question_text || question_text.trim().length === 0) {
        return res.status(400).json({ error: 'Question text is required' })
      }

      const { data: question, error } = await supabase
        .from('sermon_public_questions')
        .insert({
          sermon_id: sermonId,
          question_text: question_text.trim(),
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return res.status(201).json({ question })
    }

    if (req.method === 'PUT') {
      // Update question (admin response)
      const isAdmin = await checkAdminStatus(user.id, user.email)
      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const { question_id, admin_response, is_answered } = req.body

      if (!question_id) {
        return res.status(400).json({ error: 'Question ID is required' })
      }

      const { data: question, error } = await supabase
        .from('sermon_public_questions')
        .update({
          admin_response,
          is_answered: is_answered !== undefined ? is_answered : true
        })
        .eq('id', question_id)
        .eq('sermon_id', sermonId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return res.status(200).json({ question })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Public questions API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
