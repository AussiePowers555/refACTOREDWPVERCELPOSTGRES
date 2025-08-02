import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSignatureToken, isTokenValid } from '@/lib/signature-tokens';

const validateTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Token validation request:', body);
    const { token } = validateTokenSchema.parse(body);

    console.log('Looking for token:', token);
    // Retrieve the signature token
    const signatureToken = await getSignatureToken(token);
    console.log('Retrieved token:', signatureToken ? 'Found' : 'Not found');

    if (!signatureToken) {
      return NextResponse.json({
        isValid: false,
        isExpired: false,
        isCompleted: false,
        error: 'Invalid signature link. This link may have been tampered with or does not exist.'
      });
    }

    // Check if token is completed
    if (signatureToken.status === 'completed') {
      return NextResponse.json({
        isValid: true,
        isExpired: false,
        isCompleted: true,
        caseNumber: signatureToken.case_id,
        clientName: typeof signatureToken.form_data === 'string' ? JSON.parse(signatureToken.form_data)?.clientName : signatureToken.form_data?.clientName,
        documentType: signatureToken.document_type
      });
    }

    // Check if token is valid (not expired)
    if (!isTokenValid(signatureToken)) {
      return NextResponse.json({
        isValid: true,
        isExpired: true,
        isCompleted: false,
        caseNumber: signatureToken.case_id,
        clientName: typeof signatureToken.form_data === 'string' ? JSON.parse(signatureToken.form_data)?.clientName : signatureToken.form_data?.clientName,
        documentType: signatureToken.document_type
      });
    }

    // Token is valid and can be used - use the stored form_link which already contains prefilled data
    return NextResponse.json({
      isValid: true,
      isExpired: false,
      isCompleted: false,
      caseNumber: signatureToken.case_id,
      clientName: signatureToken.form_data?.clientName,
      documentType: signatureToken.document_type,
      formLink: signatureToken.form_link, // This already contains the token and prefilled data
      expiresAt: signatureToken.expires_at
    });

  } catch (error) {
    console.error('Error validating signature token:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        isValid: false,
        isExpired: false,
        isCompleted: false,
        error: 'Invalid request format'
      }, { status: 400 });
    }

    return NextResponse.json({
      isValid: false,
      isExpired: false,
      isCompleted: false,
      error: 'Failed to validate signature link. Please try again or contact support.'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to validate tokens.' },
    { status: 405 }
  );
}
