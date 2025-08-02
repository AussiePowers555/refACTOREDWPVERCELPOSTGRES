import { NextRequest, NextResponse } from 'next/server';
import { getSignatureToken, updateSignatureTokenFormData } from '@/lib/signature-tokens';

export async function POST(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params;
    const body = await request.json();
    const { formData } = body;
    
    // Verify token exists
    const tokenData = await getSignatureToken(token);
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }
    
    // Check if token is expired
    if (tokenData.expiresAt && new Date() > tokenData.expiresAt.toDate()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 410 }
      );
    }
    
    // Update form data as draft
    await updateSignatureTokenFormData(token, formData);
    
    console.log(`✅ Draft saved for token: ${token}`);
    
    return NextResponse.json({
      success: true,
      message: 'Draft saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}
