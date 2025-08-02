import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { DigitalSignatureService } from '@/lib/digital-signature-service';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  context: { params: { caseId: string; documentId: string } }
) {
  const { params } = context;
  try {
    // Verify document exists and user has access
    const document = await DatabaseService.getDocumentById(params.documentId);
    if (!document || document.caseId !== params.caseId) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return NextResponse.json(
        { error: 'Document file not found' },
        { status: 404 }
      );
    }

    // Read and decrypt file
    const encryptedData = fs.readFileSync(document.filePath);
    const decryptedData = DigitalSignatureService.decryptData(encryptedData);

    // Create response
    const response = new NextResponse(decryptedData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.fileName}"`,
        'Content-Length': decryptedData.length.toString(),
        'Cache-Control': 'private, max-age=3600'
      }
    });

    return response;

  } catch (error) {
    console.error('Error serving document:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document' },
      { status: 500 }
    );
  }
}
