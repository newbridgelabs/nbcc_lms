import { PDFDocument } from 'pdf-lib'

// Split PDF into sections
export const splitPDFIntoSections = async (pdfFile, sectionsCount = 5) => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const totalPages = pdfDoc.getPageCount()
    const pagesPerSection = Math.ceil(totalPages / sectionsCount)
    
    const sections = []
    
    for (let i = 0; i < sectionsCount; i++) {
      const startPage = i * pagesPerSection
      const endPage = Math.min(startPage + pagesPerSection - 1, totalPages - 1)
      
      if (startPage < totalPages) {
        const sectionDoc = await PDFDocument.create()
        
        // Copy pages to section
        for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
          const [copiedPage] = await sectionDoc.copyPages(pdfDoc, [pageIndex])
          sectionDoc.addPage(copiedPage)
        }
        
        const sectionBytes = await sectionDoc.save()
        
        sections.push({
          sectionNumber: i + 1,
          title: `Section ${i + 1} (Pages ${startPage + 1}-${endPage + 1})`,
          content: sectionBytes,
          pageRange: `${startPage + 1}-${endPage + 1}`,
          totalPages: endPage - startPage + 1
        })
      }
    }
    
    return { sections, error: null }
  } catch (error) {
    console.error('Error splitting PDF:', error)
    return { sections: null, error }
  }
}

// Upload PDF sections to Supabase
export const uploadPDFSections = async (sections, supabase) => {
  try {
    console.log('Starting PDF sections upload...')
    const sectionsMetadata = []

    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    console.log('Session token available, preparing upload...')

    // Upload all PDF files and metadata via API (which uses service role)
    const requestBody = {
      sections: sections.map(section => ({
        title: section.title,
        section_number: section.sectionNumber,
        total_sections: sections.length,
        content: Array.from(new Uint8Array(section.content)) // Convert to array for JSON
      }))
    }

    console.log('Sending request to upload API...')
    const response = await fetch('/api/admin/upload-sections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Upload API response status:', response.status)

    if (!response.ok) {
      let errorMessage = 'Failed to upload sections'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
        console.error('Upload API error:', errorData)
      } catch (parseError) {
        // If we can't parse the error response, it might be HTML
        const errorText = await response.text()
        console.error('Upload API returned non-JSON response:', errorText)
        if (errorText.includes('<html>') || errorText.includes('<!DOCTYPE')) {
          errorMessage = 'Server returned HTML instead of JSON. Check server logs for authentication issues.'
        } else {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
      }
      throw new Error(errorMessage)
    }

    const responseData = await response.json()
    console.log('Upload successful:', responseData)

    return { sections: responseData.sections, error: null }
  } catch (error) {
    console.error('Error uploading sections:', error)
    return { sections: null, error }
  }
}

// Get PDF sections
export const getPDFSections = async (supabase) => {
  try {
    if (!supabase) {
      return { sections: [], error: null }
    }

    const { data, error } = await supabase
      .from('pdf_sections')
      .select('*')
      .order('section_number')

    if (error) throw error

    return { sections: data, error: null }
  } catch (error) {
    return { sections: null, error }
  }
}

// Get section PDF URL
export const getSectionPDFUrl = async (filePath, supabase) => {
  try {
    console.log('Getting PDF URL for file path:', filePath)

    if (!filePath) {
      console.error('No file path provided')
      return null
    }

    // Since pdf-sections bucket is public, use getPublicUrl for better reliability
    const { data } = supabase.storage
      .from('pdf-sections')
      .getPublicUrl(filePath)

    console.log('Generated public URL:', data?.publicUrl)

    // Return the public URL directly - let PDF.js handle any accessibility issues
    if (data?.publicUrl) {
      console.log('Returning public URL:', data.publicUrl)
      return data.publicUrl
    }

    return null
  } catch (error) {
    console.error('Error getting PDF URL:', error)
    return null
  }
}

// Track user progress
export const markSectionComplete = async (userId, sectionId, supabase) => {
  try {
    console.log('Marking section complete:', { userId, sectionId })

    if (!userId || !sectionId) {
      throw new Error('User ID and Section ID are required')
    }

    // Use API endpoint for reliable completion
    const response = await fetch('/api/complete-section', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, sectionId })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to complete section')
    }

    console.log('Section marked complete successfully:', result.data)
    return { data: result.data, error: null }
  } catch (error) {
    console.error('Error marking section complete:', error)
    return { data: null, error }
  }
}

// Get user progress
export const getUserProgress = async (userId, supabase) => {
  try {
    if (!supabase || !userId) {
      return { progress: [], error: null }
    }

    console.log('Getting user progress for userId:', userId)

    const { data, error } = await supabase
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

    if (error) {
      console.error('Error fetching user progress:', error)
      throw error
    }

    console.log('Raw progress data:', data)

    // Filter out any records where pdf_sections is null (orphaned records)
    const validProgress = data?.filter(p => p.pdf_sections !== null) || []

    console.log('Valid progress data:', validProgress)

    return { progress: validProgress, error: null }
  } catch (error) {
    console.error('getUserProgress error:', error)
    return { progress: null, error }
  }
}
