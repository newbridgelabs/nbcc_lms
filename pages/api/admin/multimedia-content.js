import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handlePost(req, res)
  } else if (req.method === 'PUT') {
    return handlePut(req, res)
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res)
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}

// Get multimedia content for a section
async function handleGet(req, res) {
  try {
    const { section_id } = req.query

    if (!section_id) {
      return res.status(400).json({ error: 'Section ID is required' })
    }

    const { data, error } = await supabase
      .from('multimedia_content')
      .select('*')
      .eq('section_id', section_id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching multimedia content:', error)
      return res.status(500).json({ error: 'Failed to fetch content' })
    }

    res.status(200).json({ content: data || [] })
  } catch (error) {
    console.error('Error in GET multimedia content:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Create new multimedia content
async function handlePost(req, res) {
  try {
    const { section_id, content_type, title, content_data, display_order } = req.body

    console.log('POST request body:', req.body)

    if (!section_id || !content_type) {
      return res.status(400).json({
        error: 'Section ID and content type are required'
      })
    }

    // Validate that content_data has some content based on type
    if (!content_data || typeof content_data !== 'object') {
      return res.status(400).json({
        error: 'Content data must be a valid object'
      })
    }

    // Type-specific validation
    if (content_type === 'text' && !content_data.plain_text) {
      return res.status(400).json({
        error: 'Text content requires plain_text field'
      })
    }

    if (['image', 'video', 'audio', 'pdf'].includes(content_type) && !content_data.url) {
      return res.status(400).json({
        error: `${content_type} content requires url field`
      })
    }

    if (content_type === 'embed' && !content_data.embed_code) {
      return res.status(400).json({
        error: 'Embed content requires embed_code field'
      })
    }

    // Validate content_type
    const validTypes = ['text', 'image', 'video', 'audio', 'pdf', 'embed']
    if (!validTypes.includes(content_type)) {
      return res.status(400).json({ 
        error: `Invalid content type. Must be one of: ${validTypes.join(', ')}` 
      })
    }

    // Get the next display order if not provided
    let finalDisplayOrder = display_order
    if (finalDisplayOrder === undefined) {
      const { data: maxOrderData } = await supabase
        .from('multimedia_content')
        .select('display_order')
        .eq('section_id', section_id)
        .order('display_order', { ascending: false })
        .limit(1)

      finalDisplayOrder = (maxOrderData?.[0]?.display_order || 0) + 1
    }

    const { data, error } = await supabase
      .from('multimedia_content')
      .insert({
        section_id,
        content_type,
        title,
        content_data,
        display_order: finalDisplayOrder
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating multimedia content:', error)
      return res.status(500).json({ error: 'Failed to create content' })
    }

    res.status(201).json({ content: data })
  } catch (error) {
    console.error('Error in POST multimedia content:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Update multimedia content
async function handlePut(req, res) {
  try {
    const { id, title, content_data, display_order, is_active } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Content ID is required' })
    }

    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (content_data !== undefined) updateData.content_data = content_data
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('multimedia_content')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating multimedia content:', error)
      return res.status(500).json({ error: 'Failed to update content' })
    }

    res.status(200).json({ content: data })
  } catch (error) {
    console.error('Error in PUT multimedia content:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Delete multimedia content
async function handleDelete(req, res) {
  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Content ID is required' })
    }

    const { error } = await supabase
      .from('multimedia_content')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting multimedia content:', error)
      return res.status(500).json({ error: 'Failed to delete content' })
    }

    res.status(200).json({ message: 'Content deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE multimedia content:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
