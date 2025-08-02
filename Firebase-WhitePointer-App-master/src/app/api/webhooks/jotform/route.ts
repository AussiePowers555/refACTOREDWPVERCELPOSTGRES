import { NextRequest, NextResponse } from 'next/server';
import {
  validateJotFormWebhook,
  getSignedPDF,
  getSubmissionDetails,
  getDocumentTypeFromFormId
} from '@/lib/jotform';
import {
  getSignatureToken,
  completeSignatureToken
} from '@/lib/signature-tokens';
import {
  sendEmail,
  generateCompletionNotificationEmail
} from '@/lib/brevo';
import { uploadFile } from '@/lib/file-upload';

export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload
    const body = await request.text();
    let payload;
    
    try {
      payload = JSON.parse(body);
    } catch {
      // If JSON parsing fails, try to parse as form data
      const formData = new URLSearchParams(body);
      payload = Object.fromEntries(formData.entries());
    }

    console.log('JotForm webhook received:', payload);

    // Validate the webhook payload
    const validation = validateJotFormWebhook(payload);
    if (!validation.isValid) {
      console.error('Invalid JotForm webhook payload:', validation.error);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { submissionId, formId } = validation;

    // Get document type from form ID
    const documentType = getDocumentTypeFromFormId(formId!);
    if (!documentType) {
      console.error('Unknown form ID:', formId);
      return NextResponse.json(
        { success: false, error: 'Unknown form ID' },
        { status: 400 }
      );
    }

    // Get submission details to extract the signature token
    const submissionDetails = await getSubmissionDetails(submissionId!);
    const signatureToken = submissionDetails?.signature_token;

    if (!signatureToken) {
      console.error('No signature token found in submission:', submissionId);
      return NextResponse.json(
        { success: false, error: 'No signature token found in submission' },
        { status: 400 }
      );
    }

    // Verify the signature token exists and is valid
    const tokenData = await getSignatureToken(signatureToken);
    if (!tokenData) {
      console.error('Invalid signature token:', signatureToken);
      return NextResponse.json(
        { success: false, error: 'Invalid signature token' },
        { status: 400 }
      );
    }

    // Download the signed PDF from JotForm
    const { buffer, filename } = await getSignedPDF(formId!, submissionId!);

    // Upload the PDF to local file system
    const downloadURL = await uploadFile(
      buffer,
      `signed-documents/${tokenData.case_id}`,
      filename
    );

    // Complete the signature token
    await completeSignatureToken(signatureToken, submissionId!);

    // Send completion notification email
    if (tokenData.client_email) {
      const emailContent = generateCompletionNotificationEmail(
        tokenData.form_data?.clientName || 'Client',
        documentType,
        tokenData.case_id
      );

      const emailResult = await sendEmail({
        to: tokenData.client_email,
        subject: `Document Signed Successfully - Case ${tokenData.case_id}`,
        htmlContent: emailContent,
        senderName: 'White Pointer Recoveries'
      });

      if (!emailResult.success) {
        console.error('Failed to send completion notification email:', emailResult.error);
      }
    }

    // Log the successful completion
    console.log('Document signature completed:', {
      caseId: tokenData.case_id,
      documentType,
      submissionId,
      downloadURL,
      signatureToken
    });

    return NextResponse.json({
      success: true,
      message: 'Document signature processed successfully',
      data: {
        caseId: tokenData.case_id,
        documentType,
        submissionId,
        downloadURL
      }
    });

  } catch (error) {
    console.error('Error processing JotForm webhook:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process signature completion. Please contact support.' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Method not allowed. This endpoint only accepts POST requests from JotForm webhooks.' 
    },
    { status: 405 }
  );
}

// Handle other HTTP methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
