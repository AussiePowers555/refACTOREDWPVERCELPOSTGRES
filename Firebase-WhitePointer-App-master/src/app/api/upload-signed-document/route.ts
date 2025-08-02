import { NextRequest, NextResponse } from 'next/server';
import { uploadSignedDocument } from '@/lib/firebase-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string);
    
    if (!file || !metadata) {
      return NextResponse.json({ error: 'File and metadata are required' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload document
    const result = await uploadSignedDocument(metadata.caseId, metadata.fileName, buffer);
    
    return NextResponse.json({ url: result });
  } catch (error) {
    console.error('Error uploading signed document:', error);
    return NextResponse.json({ error: 'Failed to upload signed document' }, { status: 500 });
  }
}
