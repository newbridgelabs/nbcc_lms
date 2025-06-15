import { createClient } from '@supabase/supabase-js'

// This function should only be called on the server side
const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Storage operations must be performed server-side')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration for storage setup')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export const ensureStorageBuckets = async () => {
  try {
    console.log('Checking storage buckets...')
    const supabaseAdmin = getSupabaseAdmin()

    // Check if agreements bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      throw listError
    }

    console.log('Existing buckets:', buckets?.map(b => b.name))

    const agreementsBucketExists = buckets?.some(bucket => bucket.name === 'agreements')

    if (!agreementsBucketExists) {
      console.log('Creating agreements bucket...')
      
      const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket('agreements', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf']
      })

      if (createError) {
        console.error('Error creating agreements bucket:', createError)
        throw createError
      }

      console.log('Agreements bucket created successfully:', createData)
    } else {
      console.log('Agreements bucket already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('Storage setup error:', error)
    return { success: false, error }
  }
}

export const uploadAgreementPDF = async (fileName, pdfBlob) => {
  try {
    console.log('Uploading PDF:', fileName)
    const supabaseAdmin = getSupabaseAdmin()

    // Ensure bucket exists first
    await ensureStorageBuckets()

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('agreements')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true // Allow overwriting if file exists
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('agreements')
      .getPublicUrl(fileName)

    console.log('Public URL:', urlData.publicUrl)

    return {
      success: true,
      path: uploadData.path,
      publicUrl: urlData.publicUrl
    }
  } catch (error) {
    console.error('PDF upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
