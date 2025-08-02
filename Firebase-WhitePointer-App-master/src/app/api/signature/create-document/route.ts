import { NextRequest, NextResponse } from 'next/server';
import { DigitalSignatureService } from '@/lib/digital-signature-service';
import { getClientIP } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, documentType, signerName, signatureData, userAgent } = body;

    // Get client IP address
    const ipAddress = getClientIP(request);

    // Create signed document using DigitalSignatureService (server-side only)
    const signedDoc = await DigitalSignatureService.createSignedDocument(
      caseId,
      documentType,
      signerName,
      signatureData,
      ipAddress,
      userAgent
    );

    return NextResponse.json(signedDoc);
  } catch (error) {
    console.error('Error creating signed document:', error);
    return NextResponse.json(
      { error: 'Failed to create signed document' },
      { status: 500 }
    );
  }
}
