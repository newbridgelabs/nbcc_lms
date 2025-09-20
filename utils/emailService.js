import emailjs from '@emailjs/browser'

export const sendConsentEmails = async (userEmail, userName, pdfUrl, agreementId) => {
  try {
    console.log('=== CLIENT-SIDE EMAIL SENDING ===')
    console.log('Agreement ID:', agreementId)
    console.log('User Email:', userEmail)
    console.log('User Name:', userName)
    console.log('PDF URL:', pdfUrl)

    const adminEmail = 'newbridgelabs@gmail.com'
    console.log('Admin Email:', adminEmail)

    // EmailJS configuration
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const userTemplateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const adminTemplateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID // Use same template for now
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_USER_ID // Use USER_ID as public key

    if (!serviceId || !userTemplateId || !publicKey) {
      throw new Error('EmailJS configuration missing')
    }

    // Initialize EmailJS
    emailjs.init(publicKey)

    // Send email to user
    console.log('Sending user email...')
    const userEmailParams = {
      to_email: userEmail,
      to_name: userName,
      subject: '🎉 Your NBCC Membership Consent has been Approved!',
      message: `Dear ${userName},

Congratulations! 🎉 Your membership consent has been approved by the church leadership.

✅ Your membership status: APPROVED
📄 Your signed consent form is ready for download
🏛️ Welcome to the New Bridge Community Church family!

You can download your signed consent form using the link below. Please save this document for your records.

Download Link: ${pdfUrl}

We are excited to have you as part of our church community. You will receive further information about upcoming events, services, and opportunities to get involved.

If you have any questions, please don't hesitate to contact us at ${adminEmail}.

Blessings and welcome to the family!

Pastor and Leadership Team
New Bridge Community Church`,
      pdf_url: pdfUrl,
      agreement_id: agreementId
    }

    const userResponse = await emailjs.send(serviceId, userTemplateId, userEmailParams)
    console.log('✅ User email sent successfully:', userResponse)

    // Send email to admin
    console.log('Sending admin email...')
    const adminEmailParams = {
      to_email: adminEmail,
      to_name: 'NBCC Admin Team',
      subject: '📋 Consent Approved and Member Notified',
      message: `Hello Admin Team,

A consent form has been successfully approved and the member has been notified.

📊 CONSENT DETAILS:
• Member Name: ${userName}
• Member Email: ${userEmail}
• Consent ID: ${agreementId}
• Approval Date: ${new Date().toLocaleDateString()}
• PDF Document: ${pdfUrl}

✅ ACTIONS COMPLETED:
• Consent form approved by admin
• PDF generated and uploaded
• Member notification email sent successfully

The member has been welcomed to the church family and provided with their signed consent document.

This is an automated notification from the NBCC Church Management System.

---
NBCC Church Management System
Automated Email Service`,
      pdf_url: pdfUrl,
      agreement_id: agreementId,
      user_name: userName,
      user_email: userEmail
    }

    const adminResponse = await emailjs.send(serviceId, adminTemplateId, adminEmailParams)
    console.log('✅ Admin email sent successfully:', adminResponse)

    return {
      success: true,
      message: 'Both emails sent successfully',
      userResponse,
      adminResponse
    }

  } catch (error) {
    console.error('❌ Email sending error:', error)
    throw error
  }
}

// Backward compatibility - keep the old function name
export const sendAgreementEmails = sendConsentEmails
