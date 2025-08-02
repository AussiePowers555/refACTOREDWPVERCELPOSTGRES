/**
 * Brevo (formerly Sendinblue) email integration
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'whitepointer2016@gmail.com';
const BREVO_API_URL = 'https://api.brevo.com/v3';

if (!BREVO_API_KEY) {
  console.warn('BREVO_API_KEY environment variable is not set');
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  replyTo?: string;
}

export interface SMSOptions {
  to: string;
  message: string;
  sender?: string;
}

/**
 * Send email via Brevo API
 */
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!BREVO_API_KEY) {
    console.log('Brevo API key not configured. Email would be sent to:', options.to);
    console.log('Subject:', options.subject);
    console.log('Content:', options.htmlContent);
    return { success: true, messageId: 'simulated-' + Date.now() };
  }

  try {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: options.senderName || 'White Pointer Recoveries',
          email: BREVO_SENDER_EMAIL
        },
        to: [
          {
            email: options.to
          }
        ],
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent,
        replyTo: options.replyTo ? {
          email: options.replyTo
        } : undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error:', errorData);
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId
    };
  } catch (error) {
    console.error('Error sending email via Brevo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send SMS via Brevo API
 */
export async function sendSMS(options: SMSOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!BREVO_API_KEY) {
    console.log('Brevo API key not configured. SMS would be sent to:', options.to);
    console.log('Message:', options.message);
    return { success: true, messageId: 'simulated-sms-' + Date.now() };
  }

  try {
    const response = await fetch(`${BREVO_API_URL}/transactionalSMS/sms`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        type: 'transactional',
        content: options.message,
        recipient: options.to,
        sender: options.sender || 'WhitePointer'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo SMS API error:', errorData);
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.reference
    };
  } catch (error) {
    console.error('Error sending SMS via Brevo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate signature request email HTML template
 */
export function generateSignatureRequestEmail(
  clientName: string,
  documentType: string,
  signatureLink: string,
  caseNumber: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Digital Signature Required</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { 
          display: inline-block; 
          background-color: #1e40af; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
        }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Digital Signature Required</h1>
        </div>
        
        <div class="content">
          <p>Dear ${clientName},</p>
          
          <p>We need your digital signature for the following document related to case <strong>${caseNumber}</strong>:</p>
          
          <p><strong>Document Type:</strong> ${documentType}</p>
          
          <p>Please click the secure link below to access your pre-filled form. Your case information has already been filled in for your convenience:</p>
          
          <div style="text-align: center;">
            <a href="${signatureLink}" class="button">Access Pre-filled Form</a>
          </div>
          
          <div class="warning">
            <strong>Important:</strong> This secure link will expire in 72 hours for your security. 
            The form has been pre-filled with your case information - you just need to review and add your signature.
          </div>
          
          <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>
          <strong>White Pointer Recoveries Team</strong></p>
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>White Pointer Recoveries Pty Ltd</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate signature request SMS message
 */
export function generateSignatureRequestSMS(
  clientName: string,
  documentType: string,
  signatureLink: string,
  caseNumber: string
): string {
  return `Hi ${clientName}, your ${documentType} for case ${caseNumber} is ready with pre-filled info. Please review & sign: ${signatureLink} (expires in 72hrs) - White Pointer`;
}

/**
 * Generate completion notification email
 */
export function generateCompletionNotificationEmail(
  clientName: string,
  documentType: string,
  caseNumber: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document Signed Successfully</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .success { background-color: #d1fae5; border: 1px solid #059669; padding: 10px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Document Signed Successfully</h1>
        </div>
        
        <div class="content">
          <p>Dear ${clientName},</p>
          
          <div class="success">
            <strong>Success!</strong> Your ${documentType} for case ${caseNumber} has been signed and processed successfully.
          </div>
          
          <p>Thank you for completing the digital signature process. Your signed document has been securely stored and our team has been notified.</p>
          
          <p>We will proceed with processing your case and will keep you updated on any developments.</p>
          
          <p>If you need a copy of the signed document or have any questions, please contact us.</p>
          
          <p>Best regards,<br>
          <strong>White Pointer Recoveries Team</strong></p>
        </div>
        
        <div class="footer">
          <p>This is an automated confirmation message.</p>
          <p>White Pointer Recoveries Pty Ltd</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send completion notification email
 */
export async function sendCompletionNotification(
  clientEmail: string,
  clientName: string,
  documentName: string,
  caseNumber: string
): Promise<void> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #28a745; margin: 0;">✅ Document Signed Successfully</h1>
      </div>

      <div style="padding: 30px; background-color: white;">
        <p style="font-size: 16px; color: #333;">Dear ${clientName},</p>

        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Thank you for signing your <strong>${documentName}</strong>. We have successfully received and processed your signed document.
        </p>

        <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #007bff;">Document Details:</h3>
          <p style="margin: 5px 0; color: #333;"><strong>Document:</strong> ${documentName}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Case Number:</strong> ${caseNumber}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Signed:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <h3 style="color: #333;">What happens next?</h3>
        <ul style="color: #333; line-height: 1.6;">
          <li>Your signed document has been securely stored in our system</li>
          <li>Our team will review your submission</li>
          <li>We'll contact you if any additional information is needed</li>
          <li>You can expect updates on your case progress soon</li>
        </ul>

        <p style="font-size: 16px; color: #333; margin-top: 30px;">
          If you have any questions about your case, please don't hesitate to contact us.
        </p>

        <p style="font-size: 16px; color: #333;">
          Best regards,<br>
          <strong>White Pointer Recoveries Team</strong>
        </p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated confirmation email. Please do not reply to this message.</p>
        <p>For support, contact us at <a href="mailto:support@whitepointer.com.au" style="color: #007bff;">support@whitepointer.com.au</a></p>
      </div>
    </div>
  `;

  await sendEmail({
    to: clientEmail,
    subject: `Document Signed Successfully - ${documentName} (Case: ${caseNumber})`,
    htmlContent,
    senderName: 'White Pointer Recoveries'
  });
}
