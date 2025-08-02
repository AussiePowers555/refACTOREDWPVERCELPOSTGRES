import { NextRequest, NextResponse } from 'next/server';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export async function POST(request: NextRequest) {
  try {
    const { email, clientName, caseNumber } = await request.json();

    if (!email || !clientName || !caseNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: email, clientName, or caseNumber',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    const emailData = {
      sender: {
        name: 'WhitePointer Legal',
        email: 'noreply@whitepointer.com.au',
      },
      to: [
        {
          email: email,
          name: clientName,
        },
      ],
      subject: `Test Email - Case ${caseNumber}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email - WhitePointer Legal</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">WhitePointer Legal</h1>
            <h2 style="color: #3498db; margin-top: 0;">Test Email Confirmation</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 10px; border: 1px solid #e9ecef;">
            <p>Dear ${clientName},</p>
            
            <p>This is a test email to confirm that our email communication system is working correctly for your case.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2c3e50;">Case Details:</h3>
              <p><strong>Case Number:</strong> ${caseNumber}</p>
              <p><strong>Client Name:</strong> ${clientName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Test Date:</strong> ${new Date().toLocaleString('en-AU', { 
                timeZone: 'Australia/Sydney',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}</p>
            </div>
            
            <p>If you received this email, it means our communication system is functioning properly and you should receive all future case-related correspondence at this email address.</p>
            
            <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 0.9em; margin: 0;">
                Best regards,<br>
                <strong>WhitePointer Legal Team</strong><br>
                Email: info@whitepointer.com.au<br>
                Phone: +61 (0)2 1234 5678
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 0.8em;">
            <p>This is an automated test email from WhitePointer Legal case management system.</p>
          </div>
        </body>
        </html>
      `,
      textContent: `
Dear ${clientName},

This is a test email to confirm that our email communication system is working correctly for your case.

Case Details:
- Case Number: ${caseNumber}
- Client Name: ${clientName}
- Email: ${email}
- Test Date: ${new Date().toLocaleString('en-AU', { 
  timeZone: 'Australia/Sydney',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})}

If you received this email, it means our communication system is functioning properly and you should receive all future case-related correspondence at this email address.

If you have any questions or concerns, please don't hesitate to contact us.

Best regards,
WhitePointer Legal Team
Email: info@whitepointer.com.au
Phone: +61 (0)2 1234 5678

This is an automated test email from WhitePointer Legal case management system.
      `,
    };

    console.log('Sending test email to:', email);
    console.log('Using Brevo API Key:', BREVO_API_KEY.substring(0, 20) + '...');

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(emailData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Brevo API Error:', responseData);
      return NextResponse.json(
        {
          success: false,
          error: `Brevo API Error: ${responseData.message || 'Unknown error'}`,
          details: responseData,
        },
        { status: response.status }
      );
    }

    console.log('Email sent successfully:', responseData);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: responseData.messageId,
      recipient: email,
      caseNumber: caseNumber,
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}