import { NextRequest, NextResponse } from 'next/server';
import { getSignatureToken, updateSignatureTokenStatus } from '@/lib/signature-tokens';
// Removed direct import of firebase-storage
import { sendCompletionNotification } from '@/lib/brevo';

export async function POST(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params;
    const formData = await request.formData();
    
    const pdfFile = formData.get('pdf') as File;
    const formDataJson = formData.get('formData') as string;
    
    if (!pdfFile || !formDataJson) {
      return NextResponse.json(
        { error: 'Missing PDF file or form data' },
        { status: 400 }
      );
    }
    
    const submittedData = JSON.parse(formDataJson);
    
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
    
    // Upload signed PDF to Firebase Storage using the new API
    const fileName = `claims-form-${tokenData.case_id}-${Date.now()}.pdf`;
    
    // Create form data for the upload API
    const uploadFormData = new FormData();
    uploadFormData.append('file', pdfFile);
    uploadFormData.append('metadata', JSON.stringify({
      caseId: tokenData.case_id,
      fileName
    }));
    
    // Call the upload API using a relative path
    const uploadResponse = await fetch('/api/upload-signed-document', {
      method: 'POST',
      body: uploadFormData
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload signed document');
    }
    
    const uploadResult = await uploadResponse.json();
    const downloadURL = uploadResult.url;
    
    console.log(`✅ PDF uploaded: ${downloadURL}`);
    
    // Update signature token status to completed
    await updateSignatureTokenStatus(token, 'completed', {
      completed_at: new Date().toISOString(),
      pdf_url: downloadURL,
      form_data: submittedData
    });
    
    // Send completion notification email
    try {
      if (submittedData.clientEmail) {
        await sendCompletionNotification(
          submittedData.clientEmail,
          submittedData.clientName || 'Client',
          'Claims Form',
          tokenData.case_id
        );
        console.log(`✅ Completion notification sent to: ${submittedData.clientEmail}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending completion notification:', emailError);
      // Don't fail the entire request if email fails
    }
    
    console.log(`✅ Form submitted successfully for token: ${token}`);
    
    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully',
      pdfUrl: downloadURL,
      caseId: tokenData.case_id
    });
    
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}
