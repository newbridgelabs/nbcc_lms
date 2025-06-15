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

    const { id: sermonId } = req.query

    if (req.method === 'GET') {
      // Get specific sermon details (no auth required for viewing)
      const { data: sermon, error } = await supabase
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
        .eq('id', sermonId)
        .eq('is_active', true)
        .order('question_order', { foreignTable: 'sermon_questions', ascending: true })
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Sermon not found' })
        }
        throw error
      }

      return res.status(200).json({ sermon })
    }

    if (req.method === 'PUT') {
      // Update sermon (admin only)
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
        is_active,
        questions 
      } = req.body

      if (!title?.trim()) {
        return res.status(400).json({ error: 'Title is required' })
      }

      if (!sermon_date) {
        return res.status(400).json({ error: 'Sermon date is required' })
      }

      if (!questions || questions.length === 0) {
        return res.status(400).json({ error: 'At least one question is required' })
      }

      // Start transaction
      const { data: updatedSermon, error: sermonError } = await supabase
        .from('sermons')
        .update({
          title: title.trim(),
          description: description?.trim() || null,
          sermon_date,
          pastor_name: pastor_name?.trim() || null,
          scripture_reference: scripture_reference?.trim() || null,
          is_active: is_active !== false
        })
        .eq('id', sermonId)
        .select()
        .single()

      if (sermonError) {
        throw sermonError
      }

      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('sermon_questions')
        .delete()
        .eq('sermon_id', sermonId)

      if (deleteError) {
        throw deleteError
      }

      // Insert new questions
      const questionsToInsert = questions.map((question, index) => ({
        sermon_id: sermonId,
        question_text: question.question_text.trim(),
        question_order: index + 1,
        is_private: question.is_private !== false,
        placeholder_text: question.placeholder_text?.trim() || null
      }))

      const { data: insertedQuestions, error: questionsError } = await supabase
        .from('sermon_questions')
        .insert(questionsToInsert)
        .select()

      if (questionsError) {
        throw questionsError
      }

      return res.status(200).json({ 
        sermon: updatedSermon,
        questions: insertedQuestions
      })
    }

    if (req.method === 'DELETE') {
      // Delete sermon (admin only)
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const isAdmin = await checkAdminStatus(user.id, user.email)
      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const { error } = await supabase
        .from('sermons')
        .delete()
        .eq('id', sermonId)

      if (error) {
        throw error
      }

      return res.status(200).json({ message: 'Sermon deleted successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Sermon API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
