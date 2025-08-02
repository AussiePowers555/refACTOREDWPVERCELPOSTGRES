import { NextRequest, NextResponse } from 'next/server';
import { blobStorage } from '@/lib/vercel-blob';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Vercel Blob storage...');
    
    // Create a test PDF buffer
    const testPdfContent = Buffer.from(`
      %PDF-1.4
      1 0 obj
      <<
      /Type /Catalog
      /Pages 2 0 R
      >>
      endobj
      
      2 0 obj
      <<
      /Type /Pages
      /Kids [3 0 R]
      /Count 1
      >>
      endobj
      
      3 0 obj
      <<
      /Type /Page
      /Parent 2 0 R
      /MediaBox [0 0 612 792]
      /Contents 4 0 R
      >>
      endobj
      
      4 0 obj
      <<
      /Length 44
      >>
      stream
      BT
      /F1 12 Tf
      100 700 Td
      (Test PDF for Vercel Blob) Tj
      ET
      endstream
      endobj
      
      xref
      0 5
      0000000000 65535 f 
      0000000009 00000 n 
      0000000074 00000 n 
      0000000120 00000 n 
      0000000179 00000 n 
      trailer
      <<
      /Size 5
      /Root 1 0 R
      >>
      startxref
      274
      %%EOF
    `);

    // Test 1: Upload PDF
    console.log('📤 Testing PDF upload...');
    const uploadResult = await blobStorage.uploadPDF(
      'test-vercel-blob.pdf',
      testPdfContent,
      'test'
    );
    console.log('✅ PDF upload successful:', uploadResult);

    // Test 2: List files
    console.log('📋 Testing file listing...');
    const fileList = await blobStorage.listFiles('test');
    console.log('✅ File listing successful:', fileList);

    // Test 3: Get file info
    console.log('ℹ️ Testing file info retrieval...');
    const fileInfo = await blobStorage.getFileInfo(uploadResult.url);
    console.log('✅ File info retrieval successful:', fileInfo);

    // Test 4: Upload with unique naming
    console.log('🔄 Testing unique naming...');
    const uniqueUpload = await blobStorage.uploadFileWithUniqueNaming(
      'test-unique.pdf',
      testPdfContent,
      'application/pdf',
      'test',
      'unique-test'
    );
    console.log('✅ Unique naming upload successful:', uniqueUpload);

    return NextResponse.json({
      success: true,
      message: 'All Vercel Blob tests passed!',
      results: {
        uploadResult,
        fileList,
        fileInfo,
        uniqueUpload
      }
    });

  } catch (error) {
    console.error('❌ Vercel Blob test failed:', error);
    
    // Check if the error is due to missing token
    if (error instanceof Error && error.message.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json({
        success: false,
        error: 'Vercel Blob token not configured',
        message: 'Please set BLOB_READ_WRITE_TOKEN in your .env.local file',
        details: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Vercel Blob test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Vercel Blob Test Endpoint',
    instructions: 'Send a POST request to test Vercel Blob functionality'
  });
}