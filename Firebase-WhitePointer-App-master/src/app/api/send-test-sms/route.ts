import { NextRequest, NextResponse } from 'next/server';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SMS_API_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';

// Format Australian phone number for international SMS
function formatAustralianPhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, remove it and add +61
  if (cleaned.startsWith('0')) {
    cleaned = '+61' + cleaned.substring(1);
  }
  // If starts with 61, add +
  else if (cleaned.startsWith('61')) {
    cleaned = '+' + cleaned;
  }
  // If doesn't start with + or 61, assume it's missing country code
  else if (!cleaned.startsWith('+61')) {
    cleaned = '+61' + cleaned;
  }
  
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const { phone, clientName, caseNumber } = await request.json();

    if (!phone || !clientName || !caseNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: phone, clientName, or caseNumber',
        },
        { status: 400 }
      );
    }

    // Format the phone number for Australian SMS
    const formattedPhone = formatAustralianPhone(phone);
    
    console.log('Original phone:', phone);
    console.log('Formatted phone:', formattedPhone);

    // Validate formatted phone number
    const phoneRegex = /^\+61[1-9]\d{8}$/;
    if (!phoneRegex.test(formattedPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid Australian phone number format. Expected format: +61XXXXXXXXX (got: ${formattedPhone})`,
        },
        { status: 400 }
      );
    }

    const smsData = {
      type: 'transactional',
      unicodeEnabled: false,
      sender: 'WhitePointer',
      recipient: formattedPhone,
      content: `Hi ${clientName}, this is a test SMS from WhitePointer Legal for case ${caseNumber}. Our SMS communication system is working correctly. If you received this message, you should receive all future case-related SMS notifications at this number. Test sent: ${new Date().toLocaleString('en-AU', { 
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}. Reply STOP to unsubscribe.`,
    };

    console.log('Sending test SMS to:', formattedPhone);
    console.log('Using Brevo API Key:', BREVO_API_KEY.substring(0, 20) + '...');
    console.log('SMS Content length:', smsData.content.length);

    const response = await fetch(BREVO_SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(smsData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Brevo SMS API Error:', responseData);
      return NextResponse.json(
        {
          success: false,
          error: `Brevo SMS API Error: ${responseData.message || 'Unknown error'}`,
          details: responseData,
          formattedPhone,
          originalPhone: phone,
        },
        { status: response.status }
      );
    }

    console.log('SMS sent successfully:', responseData);

    return NextResponse.json({
      success: true,
      message: 'Test SMS sent successfully',
      messageId: responseData.messageId,
      recipient: formattedPhone,
      originalPhone: phone,
      caseNumber: caseNumber,
      smsContent: smsData.content,
    });

  } catch (error) {
    console.error('Error sending test SMS:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}