import { createClient } from '@supabase/supabase-js'
import { checkAdminAccessAPI } from '../../../lib/admin-config'

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Upload sections API called')
    console.log('Request headers:', req.headers)

    // Check admin access
    const { user, error: authError } = await checkAdminAccessAPI(req)
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return res.status(401).json({ error: authError || 'Unauthorized' })
    }

    console.log('Admin authenticated:', user.email)

    const { sections } = req.body

    if (!sections || !Array.isArray(sections)) {
      console.log('Invalid sections data:', sections)
      return res.status(400).json({ error: 'Invalid sections data' })
    }

    console.log('Processing', sections.length, 'sections')

    // Clear existing sections first
    console.log('Clearing existing sections...')
    const { error: deleteError } = await supabaseAdmin
      .from('pdf_sections')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      console.error('Error deleting existing sections:', deleteError)
      return res.status(500).json({ error: 'Failed to clear existing sections', details: deleteError.message })
    }

    // Upload files and insert sections
    const sectionsToInsert = []

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      console.log(`Processing section ${i + 1}/${sections.length}:`, section.title)

      try {
        // Convert array back to Uint8Array for upload
        const content = new Uint8Array(section.content)
        const fileName = `section-${section.section_number}-${Date.now()}.pdf`

        console.log(`Uploading file: ${fileName}, size: ${content.length} bytes`)

        // Upload to storage using service role
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('pdf-sections')
          .upload(fileName, content, {
            contentType: 'application/pdf'
          })

        if (uploadError) {
          console.error('Error uploading file:', uploadError)
          return res.status(500).json({
            error: `Failed to upload section ${section.section_number}`,
            details: uploadError.message
          })
        }

        console.log('File uploaded successfully:', uploadData.path)

        sectionsToInsert.push({
          title: section.title,
          section_number: section.section_number,
          total_sections: section.total_sections,
          file_path: uploadData.path
        })
      } catch (sectionError) {
        console.error(`Error processing section ${section.section_number}:`, sectionError)
        return res.status(500).json({
          error: `Failed to process section ${section.section_number}`,
          details: sectionError.message
        })
      }
    }

    console.log('Inserting sections into database...')
    const { data: insertedSections, error: insertError } = await supabaseAdmin
      .from('pdf_sections')
      .insert(sectionsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting sections:', insertError)
      return res.status(500).json({
        error: 'Failed to insert sections',
        details: insertError.message
      })
    }

    console.log('Upload completed successfully:', insertedSections.length, 'sections')
    res.status(200).json({ sections: insertedSections })

  } catch (error) {
    console.error('Upload sections error:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
