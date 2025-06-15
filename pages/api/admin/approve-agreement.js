import { generateAgreementPDF } from '../../../lib/pdf-generator'
import { uploadAgreementPDF } from '../../../lib/storage-setup'
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { agreementId, pastorSignature } = req.body

    if (!agreementId || !pastorSignature) {
      return res.status(400).json({ 
        error: 'Agreement ID and pastor signature are required' 
      })
    }

    console.log('Starting agreement approval process for:', agreementId)

    // Get the agreement from database
    const { data: agreement, error: fetchError } = await supabase
      .from('agreements')
      .select('*')
      .eq('id', agreementId)
      .single()

    if (fetchError || !agreement) {
      console.error('Error fetching agreement:', fetchError)
      return res.status(404).json({ error: 'Agreement not found' })
    }

    console.log('Agreement found, generating PDF...')

    // Generate PDF with both signatures
    const pdfBlob = await generateAgreementPDF(agreement, pastorSignature)
    console.log('PDF generated successfully, size:', pdfBlob.size)

    // Upload PDF to storage
    const fileName = `agreement-${agreement.id}-${Date.now()}.pdf`
    console.log('Uploading PDF with filename:', fileName)

    const uploadResult = await uploadAgreementPDF(fileName, pdfBlob)

    if (!uploadResult.success) {
      console.error('Upload failed:', uploadResult.error)
      return res.status(500).json({ 
        error: `Upload failed: ${uploadResult.error}` 
      })
    }

    console.log('PDF uploaded successfully:', uploadResult.publicUrl)

    // Update agreement with pastor signature and PDF URL
    console.log('Updating agreement in database...')
    const { error: updateError } = await supabase
      .from('agreements')
      .update({
        pastor_signature: pastorSignature,
        pdf_url: uploadResult.publicUrl,
        status: 'completed',
        signed_at: new Date().toISOString()
      })
      .eq('id', agreement.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return res.status(500).json({ 
        error: `Database update failed: ${updateError.message}` 
      })
    }

    console.log('Agreement updated in database successfully')

    // Email sending will be handled by client-side code
    console.log('=== EMAIL WILL BE SENT BY CLIENT-SIDE ===')
    console.log('User email:', agreement.form_data?.email)
    console.log('User name:', agreement.form_data?.fullName)
    console.log('PDF URL:', uploadResult.publicUrl)

    return res.status(200).json({
      success: true,
      message: 'Agreement approved and PDF generated successfully',
      pdfUrl: uploadResult.publicUrl
    })

  } catch (error) {
    console.error('Error approving agreement:', error)
    return res.status(500).json({ 
      error: `Failed to approve agreement: ${error.message}` 
    })
  }
}
