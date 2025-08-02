import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { markTokenAsAccessed } from '@/lib/signature-tokens';

const markAccessedSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = markAccessedSchema.parse(body);

    // Mark the token as accessed
    const signatureToken = await markTokenAsAccessed(token);

    if (!signatureToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid or expired signature token' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token marked as accessed successfully',
      data: {
        caseNumber: signatureToken.case_id,
        documentType: signatureToken.document_type,
        status: signatureToken.status
      }
    });

  } catch (error) {
    console.error('Error marking token as accessed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request format',
          details: error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to mark token as accessed. Please try again.' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to mark tokens as accessed.' },
    { status: 405 }
  );
}
