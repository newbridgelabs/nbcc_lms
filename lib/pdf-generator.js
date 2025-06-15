import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const generateAgreementPDF = async (agreement, pastorSignature) => {
  try {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Letter size
    const { width, height } = page.getSize()
    
    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const formData = agreement.form_data
    let yPosition = height - 50
    
    // Header
    page.drawText('NBCC MEMBERSHIP AGREEMENT', {
      x: 50,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    
    yPosition -= 30
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
    })
    
    yPosition -= 40
    
    // Personal Information Section
    page.drawText('PERSONAL INFORMATION', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    })
    
    yPosition -= 25
    
    const personalInfo = [
      ['Full Name:', formData.fullName],
      ['Email:', formData.email],
      ['Phone:', formData.phone],
      ['Date of Birth:', formData.dateOfBirth],
      ['Address:', formData.address],
    ]
    
    personalInfo.forEach(([label, value]) => {
      page.drawText(label, {
        x: 50,
        y: yPosition,
        size: 10,
        font: boldFont,
      })
      
      page.drawText(value || 'Not provided', {
        x: 150,
        y: yPosition,
        size: 10,
        font: font,
      })
      
      yPosition -= 20
    })
    
    yPosition -= 20
    
    // Emergency Contact Section
    page.drawText('EMERGENCY CONTACT', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    })
    
    yPosition -= 25
    
    const emergencyInfo = [
      ['Contact Name:', formData.emergencyContact],
      ['Contact Phone:', formData.emergencyPhone],
    ]
    
    emergencyInfo.forEach(([label, value]) => {
      page.drawText(label, {
        x: 50,
        y: yPosition,
        size: 10,
        font: boldFont,
      })
      
      page.drawText(value || 'Not provided', {
        x: 150,
        y: yPosition,
        size: 10,
        font: font,
      })
      
      yPosition -= 20
    })
    
    yPosition -= 20
    
    // Church Background Section
    page.drawText('CHURCH BACKGROUND', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    })
    
    yPosition -= 25
    
    const churchInfo = [
      ['Previous Church:', formData.previousChurch],
      ['Baptized:', formData.baptized],
    ]
    
    churchInfo.forEach(([label, value]) => {
      page.drawText(label, {
        x: 50,
        y: yPosition,
        size: 10,
        font: boldFont,
      })
      
      page.drawText(value || 'Not specified', {
        x: 150,
        y: yPosition,
        size: 10,
        font: font,
      })
      
      yPosition -= 20
    })
    
    // Testimony (if provided)
    if (formData.testimony) {
      yPosition -= 10
      page.drawText('Testimony:', {
        x: 50,
        y: yPosition,
        size: 10,
        font: boldFont,
      })
      
      yPosition -= 15
      
      // Split testimony into lines to fit page width
      const testimonyLines = splitTextIntoLines(formData.testimony, 500, font, 10)
      testimonyLines.forEach(line => {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
        })
        yPosition -= 15
      })
    }
    
    yPosition -= 30
    
    // Agreement Text
    page.drawText('MEMBERSHIP AGREEMENT', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    })
    
    yPosition -= 25
    
    const agreementText = [
      'I hereby request membership in this church and agree to:',
      '• Support the church with my prayers, presence, gifts, and service',
      '• Live according to Christian principles and church teachings',
      '• Participate actively in the life and ministry of the church',
      '• Submit to the spiritual authority of the church leadership',
      '',
      'I confirm that all information provided above is accurate and complete.',
    ]
    
    agreementText.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
      })
      yPosition -= 15
    })
    
    yPosition -= 30
    
    // Signatures Section
    page.drawText('SIGNATURES', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    })
    
    yPosition -= 40
    
    // Member Signature
    if (agreement.user_signature) {
      try {
        console.log('Embedding user signature...')
        // Handle both data URLs and regular URLs
        let signatureImageBytes

        if (agreement.user_signature.startsWith('data:')) {
          // Data URL - convert to blob first
          const response = await fetch(agreement.user_signature)
          signatureImageBytes = await response.arrayBuffer()
        } else {
          // Regular URL
          const response = await fetch(agreement.user_signature)
          if (!response.ok) {
            throw new Error(`Failed to fetch signature: ${response.status}`)
          }
          signatureImageBytes = await response.arrayBuffer()
        }

        const signatureImage = await pdfDoc.embedPng(signatureImageBytes)

        page.drawImage(signatureImage, {
          x: 50,
          y: yPosition - 40,
          width: 150,
          height: 40,
        })
        console.log('User signature embedded successfully')
      } catch (error) {
        console.error('Error embedding user signature:', error)
        page.drawText('[User Signature - Error Loading]', {
          x: 50,
          y: yPosition - 20,
          size: 10,
          font: font,
        })
      }
    } else {
      page.drawText('[No User Signature]', {
        x: 50,
        y: yPosition - 20,
        size: 10,
        font: font,
      })
    }
    
    page.drawText('_________________________', {
      x: 50,
      y: yPosition - 50,
      size: 10,
      font: font,
    })
    
    page.drawText(`Member: ${formData.fullName}`, {
      x: 50,
      y: yPosition - 65,
      size: 10,
      font: font,
    })
    
    page.drawText(`Date: ${new Date(agreement.created_at).toLocaleDateString()}`, {
      x: 50,
      y: yPosition - 80,
      size: 10,
      font: font,
    })
    
    // Pastor Signature
    if (pastorSignature) {
      try {
        console.log('Embedding pastor signature...')
        // Handle both data URLs and regular URLs
        let pastorImageBytes

        if (pastorSignature.startsWith('data:')) {
          // Data URL - convert to blob first
          const response = await fetch(pastorSignature)
          pastorImageBytes = await response.arrayBuffer()
        } else {
          // Regular URL
          const response = await fetch(pastorSignature)
          if (!response.ok) {
            throw new Error(`Failed to fetch pastor signature: ${response.status}`)
          }
          pastorImageBytes = await response.arrayBuffer()
        }

        const pastorImage = await pdfDoc.embedPng(pastorImageBytes)

        page.drawImage(pastorImage, {
          x: 320,
          y: yPosition - 40,
          width: 150,
          height: 40,
        })
        console.log('Pastor signature embedded successfully')
      } catch (error) {
        console.error('Error embedding pastor signature:', error)
        page.drawText('[Pastor Signature - Error Loading]', {
          x: 320,
          y: yPosition - 20,
          size: 10,
          font: font,
        })
      }
    } else {
      page.drawText('[No Pastor Signature]', {
        x: 320,
        y: yPosition - 20,
        size: 10,
        font: font,
      })
    }
    
    page.drawText('_________________________', {
      x: 320,
      y: yPosition - 50,
      size: 10,
      font: font,
    })
    
    page.drawText('Pastor/Church Leader', {
      x: 320,
      y: yPosition - 65,
      size: 10,
      font: font,
    })
    
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 320,
      y: yPosition - 80,
      size: 10,
      font: font,
    })
    
    // Footer
    page.drawText('NBCC LMS - Church Membership Agreement', {
      x: 50,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
      x: 400,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF: ' + error.message)
  }
}

// Helper function to split text into lines
function splitTextIntoLines(text, maxWidth, font, fontSize) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const textWidth = font.widthOfTextAtSize(testLine, fontSize)
    
    if (textWidth <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        lines.push(word)
      }
    }
  })
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines
}
