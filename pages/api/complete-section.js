import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, sectionId } = req.body

    console.log('Completing section:', { userId, sectionId })

    if (!userId || !sectionId) {
      return res.status(400).json({ error: 'User ID and Section ID are required' })
    }

    // Verify the section exists
    const { data: section, error: sectionError } = await supabaseAdmin
      .from('pdf_sections')
      .select('*')
      .eq('id', sectionId)
      .single()

    if (sectionError) {
      console.error('Section lookup error:', sectionError)
      return res.status(400).json({ error: 'Section not found' })
    }

    // Check if progress already exists
    const { data: existingProgress, error: checkError } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('section_id', sectionId)
      .single()

    let result
    if (existingProgress) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from('user_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('section_id', sectionId)
        .select()
      
      if (error) {
        console.error('Update error:', error)
        throw error
      }
      result = data
    } else {
      // Insert new record
      const { data, error } = await supabaseAdmin
        .from('user_progress')
        .insert({
          user_id: userId,
          section_id: sectionId,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .select()
      
      if (error) {
        console.error('Insert error:', error)
        throw error
      }
      result = data
    }

    console.log('Section completed successfully:', result)

    // Check if the section still exists
    const { data: sectionCheck, error: sectionCheckError } = await supabaseAdmin
      .from('pdf_sections')
      .select('*')
      .eq('id', sectionId)
      .single()

    console.log('Section check:', sectionCheck)
    console.log('Section check error:', sectionCheckError)

    // Also fetch updated progress to verify
    const { data: updatedProgress, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select(`
        *,
        pdf_sections (
          id,
          title,
          section_number,
          total_sections
        )
      `)
      .eq('user_id', userId)

    if (progressError) {
      console.error('Error fetching updated progress:', progressError)
    }
    console.log('Updated progress after completion:', updatedProgress)
    console.log('Progress query error:', progressError)

    return res.status(200).json({
      success: true,
      data: result,
      updatedProgress: updatedProgress
    })

  } catch (error) {
    console.error('Section completion error:', error)
    return res.status(500).json({ 
      error: 'Failed to complete section', 
      details: error.message 
    })
  }
}
