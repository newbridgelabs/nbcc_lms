import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const generateConsentPDF = async (agreement, pastorSignature) => {
  try {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Letter size
    const { width, height } = page.getSize()

    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const formData = agreement.form_data
    let yPosition = height - 50

    // Church Letterhead
    page.drawText('NEW BRIDGE COMMUNITY CHURCH', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    yPosition -= 25
    page.drawText('Registration Number: [CHURCH_REG_NUMBER]', {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })

    yPosition -= 15
    page.drawText('Address: [CHURCH_ADDRESS]', {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })

    yPosition -= 15
    page.drawText('Phone: [CHURCH_PHONE] | Email: [CHURCH_EMAIL]', {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })

    yPosition -= 50

    // Document Title
    page.drawText('MEMBERSHIP CONSENT FORM', {
      x: 50,
      y: yPosition,
      size: 16,
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
    
    yPosition -= 50

    // Consent Statement
    page.drawText('MEMBERSHIP CONSENT', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    })

    yPosition -= 30

    const consentText = [
      'I hereby request membership in New Bridge Community Church and agree to:',
      '',
      '• Support the church with my prayers, presence, gifts, and service',
      '• Live according to Christian principles and church teachings',
      '• Participate actively in the life and ministry of the church',
      '• Submit to the spiritual authority of the church leadership',
      '',
      'I confirm that I have completed the required membership preparation',
      'and understand the commitments of church membership.',
    ]

    consentText.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 11,
        font: font,
      })
      yPosition -= 18
    })

    yPosition -= 30

    // Member Information
    page.drawText('MEMBER INFORMATION', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    })

    yPosition -= 30

    // Full Name
    page.drawText('Full Name:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    })

    page.drawText(formData.fullName || 'Not provided', {
      x: 150,
      y: yPosition,
      size: 12,
      font: font,
    })

    yPosition -= 50
    
    // Signatures Section
    page.drawText('SIGNATURES', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    })

    yPosition -= 40
    // Member Signature
    page.drawText('Member Signature:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    })

    yPosition -= 30

    // Draw signature line
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 300, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    yPosition -= 20

    // Member name and date
    page.drawText(`${formData.fullName || 'Member Name'}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    })

    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 200,
      y: yPosition,
      size: 10,
      font: font,
    })

    yPosition -= 60
    // Pastor/Church Representative Signature
    page.drawText('Church Representative Signature:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
    })

    yPosition -= 30
    // Draw signature line for church representative
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 300, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    yPosition -= 20

    // Church representative name and date
    page.drawText('Pastor/Church Representative', {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    })

    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 200,
      y: yPosition,
      size: 10,
      font: font,
    })

    yPosition -= 40

    // Footer with church registration
    page.drawText('This document certifies membership in New Bridge Community Church', {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })

    yPosition -= 15
    page.drawText('Registration Number: [CHURCH_REG_NUMBER]', {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })

    // Generate and return PDF
    const pdfBytes = await pdfDoc.save()
    return pdfBytes

  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

// Backward compatibility - keep the old function name
export const generateAgreementPDF = generateConsentPDF

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
