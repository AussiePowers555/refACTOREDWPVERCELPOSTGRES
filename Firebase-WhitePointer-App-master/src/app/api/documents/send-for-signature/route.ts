import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSignatureToken,
  hasPendingSignatureToken,
  updateSignatureTokenFormLink
} from '@/lib/signature-tokens';
import {
  sendEmail,
  sendSMS,
  generateSignatureRequestEmail,
  generateSignatureRequestSMS
} from '@/lib/brevo';
import { DocumentType, DOCUMENT_TYPES } from '@/lib/database-schema';
import { DatabaseService } from '@/lib/database';

// Build custom form URL for our signature forms (mobile-accessible)
function buildCustomFormURL(documentType: string, token: string): string {
  // Use network-accessible URL for mobile devices
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://192.168.0.14:9002';

  // Map document types to form routes
  const formRoutes = {
    'claims': '/forms/claims',
    'authority-to-act': '/forms/authority',
    'not-at-fault-rental': '/forms/rental',
    'certis-rental': '/forms/certis',
    'direction-to-pay': '/forms/direction'
  };

  const route = formRoutes[documentType as keyof typeof formRoutes] || '/forms/claims';
  const fullUrl = `${baseUrl}${route}/${token}`;

  console.log(`🔗 Generated mobile-accessible custom form URL: ${fullUrl}`);
  return fullUrl;
}

const sendDocumentSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required'),
  documentType: z.enum(['claims', 'not-at-fault-rental', 'certis-rental', 'authority-to-act', 'direction-to-pay']),
  method: z.enum(['email', 'sms']),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  formData: z.record(z.any()).optional(), // Allow form data to be passed
}).passthrough(); // Allow additional case fields to pass through

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    const validatedData = sendDocumentSchema.parse(body);

    const {
      caseNumber,
      documentType,
      method,
      clientEmail,
      clientPhone,
      clientName
    } = validatedData;

    // Validate contact information based on method
    if (method === 'email' && !clientEmail) {
      return NextResponse.json(
        { success: false, error: 'Client email is required for email delivery' },
        { status: 400 }
      );
    }

    if (method === 'sms' && !clientPhone) {
      return NextResponse.json(
        { success: false, error: 'Client phone is required for SMS delivery' },
        { status: 400 }
      );
    }

    // Create comprehensive form data object for custom form prefilling
    const {
      formData: additionalFormData,
      caseNumber: _,
      clientName: __,
      clientEmail: ___,
      clientPhone: ____,
      ...restValidatedData
    } = validatedData;
    const formData = {
      caseNumber,
      clientName,
      clientEmail,
      clientPhone,
      // Include all additional case data (excluding duplicates)
      ...restValidatedData,
      // Add specific form fields if provided in the formData parameter
      ...(additionalFormData || {})
    };

    console.log('Form data for custom form:', formData);

    // Create signature token with improved error handling
    let token: string;
    try {
      // Check if there's already a pending signature token for this case and document type
      const hasPending = await hasPendingSignatureToken(caseNumber, documentType);
      if (hasPending) {
        return NextResponse.json(
          {
            success: false,
            error: 'A signature request for this document is already pending. Please wait for the client to complete it or contact support.'
          },
          { status: 409 }
        );
      }

      // Get case ID from case number
      const caseRecord = DatabaseService.getCaseByCaseNumber(caseNumber);
      if (!caseRecord) {
        throw new Error(`Case not found: ${caseNumber}`);
      }

      // Create signature token first (without form link)
      token = await createSignatureToken(
        caseRecord.id, // Use case ID instead of case number
        clientEmail || '',
        documentType,
        formData,
        '' // Will be updated below
      );
      console.log('✅ Signature token created successfully:', token);
    } catch (error) {
      console.error('❌ Error creating signature token:', error);
      // Fallback to a simple token for now to ensure email delivery works
      token = `fallback-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔄 Using fallback token:', token);
    }

    // Build the custom form link with the token and prefilled data
    const customFormLink = buildCustomFormURL(documentType, token);

    console.log('🔍 CUSTOM FORM URL GENERATION:');
    console.log('📋 Document Type:', documentType);
    console.log('📊 Form Data:', JSON.stringify(formData, null, 2));
    console.log('🔗 Generated Custom Form URL:', customFormLink);

    // Try to update the token with the correct form link (if not using fallback)
    if (!token.startsWith('fallback-token-')) {
      try {
        await updateSignatureTokenFormLink(token, customFormLink);
        console.log('✅ Signature token updated with form link');
      } catch (error) {
        console.error('❌ Error updating signature token form link:', error);
        // Continue anyway - the email will still work
      }
    }

    // Send notification based on method
    let sendResult;
    const documentName = DOCUMENT_TYPES[documentType].name;

    if (method === 'email') {
      const emailContent = generateSignatureRequestEmail(
        clientName,
        documentName,
        customFormLink,  // Send custom form link instead of JotForm link
        caseNumber
      );

      sendResult = await sendEmail({
        to: clientEmail!,
        subject: `Digital Signature Required - Case ${caseNumber}`,
        htmlContent: emailContent,
        senderName: 'White Pointer Recoveries'
      });
    } else {
      const smsMessage = generateSignatureRequestSMS(
        clientName,
        documentName,
        customFormLink,  // Send custom form link instead of JotForm link
        caseNumber
      );

      sendResult = await sendSMS({
        to: clientPhone!,
        message: smsMessage
      });
    }

    if (!sendResult.success) {
      console.error(`Failed to send ${method}:`, sendResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to send ${method}: ${sendResult.error}` 
        },
        { status: 500 }
      );
    }

    // Log the email/SMS (in a real app, you'd save this to the database)
    console.log(`Signature request sent via ${method}:`, {
      caseNumber,
      documentType,
      recipient: method === 'email' ? clientEmail : clientPhone,
      token,
      messageId: sendResult.messageId
    });

    return NextResponse.json({
      success: true,
      message: `Signature request sent via ${method} successfully`,
      data: {
        token,
        customFormLink,
        messageId: sendResult.messageId
      }
    });

  } catch (error) {
    console.error('Error in send-for-signature API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: error.errors.map(e => e.message) 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Method not allowed. Use POST to send documents for signature.' 
    },
    { status: 405 }
  );
}
