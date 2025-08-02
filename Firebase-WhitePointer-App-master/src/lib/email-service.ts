// Simple email service for SQLite version
export async function sendEmail(options: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}) {
  // For development, just log the email
  console.log('📧 Email would be sent:', {
    to: options.to,
    subject: options.subject,
    hasHtml: !!options.html,
    hasAttachments: !!options.attachments?.length
  });
  
  // In production, integrate with your email service (Brevo, SendGrid, etc.)
  return { success: true, messageId: `mock-${Date.now()}` };
}