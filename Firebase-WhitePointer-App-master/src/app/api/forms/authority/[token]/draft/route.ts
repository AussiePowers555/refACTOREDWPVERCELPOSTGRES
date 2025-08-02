import { NextRequest, NextResponse } from 'next/server';
import { getSignatureToken, updateSignatureTokenStatus } from '@/lib/signature-tokens';

export async function POST(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params;
    const draftData = await request.json();
    
    console.log('🔄 Saving Authority to Act form draft for token:', token);
    console.log('📄 Draft data:', draftData);
    
    // Get signature token data
    const tokenData = await getSignatureToken(token);
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    // Check if this is an Authority to Act form
    if (tokenData.documentType !== 'authority-to-act') {
      return NextResponse.json(
        { error: 'Invalid document type for this form' },
        { status: 400 }
      );
    }

    // Update signature token with draft data
    await updateSignatureTokenStatus(token, 'draft', {
      lastSavedAt: new Date().toISOString(),
      draftData: draftData
    });
    
    console.log('✅ Authority to Act form draft saved successfully:', {
      token,
      caseId: tokenData.caseId,
      lastSavedAt: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Draft saved successfully',
      lastSavedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error saving Authority to Act form draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}
