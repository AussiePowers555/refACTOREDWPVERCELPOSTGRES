import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateSignatureRequestEmail } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, caseNumber } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create a test custom form link (mobile-accessible)
    const testToken = `test-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://192.168.0.14:9002';
    const testCustomFormLink = `${baseUrl}/forms/claims/${testToken}`;

    console.log(`🔗 Generated mobile-accessible test form URL: ${testCustomFormLink}`);

    // Generate email content
    const emailContent = generateSignatureRequestEmail(
      'John Smith',
      'Claims Form',
      testCustomFormLink,
      caseNumber || '2025-001'
    );

    // Send the email
    const sendResult = await sendEmail({
      to: email,
      subject: `Test Prefilled Form - Case ${caseNumber || '2025-001'}`,
      htmlContent: emailContent,
      senderName: 'White Pointer Recoveries'
    });

    if (!sendResult.success) {
      console.error('Failed to send test email:', sendResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to send email: ${sendResult.error}` 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test prefilled form email sent successfully',
      data: {
        customFormLink: testCustomFormLink,
        messageId: sendResult.messageId
      }
    });

  } catch (error) {
    console.error('Error in test-email-prefilled API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error. Please try again later.' 
      },
      { status: 500 }
    );
  }
}
