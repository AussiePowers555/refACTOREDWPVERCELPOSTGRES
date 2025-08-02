import { NextRequest, NextResponse } from 'next/server';
import { getSignatureToken, updateSignatureTokenStatus } from '@/lib/signature-tokens';
// Removed direct import of firebase-storage

export async function POST(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params;
    const submissionData = await request.json();
    
    console.log('🔄 Submitting Authority to Act form for token:', token);
    console.log('📄 Submission data:', {
      ...submissionData,
      notAtFaultSignature: submissionData.notAtFaultSignature ? '[SIGNATURE_DATA]' : 'MISSING',
      atFaultSignature: submissionData.atFaultSignature ? '[SIGNATURE_DATA]' : 'MISSING'
    });
    
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

    // Validate required signatures
    if (!submissionData.notAtFaultSignature || !submissionData.atFaultSignature) {
      return NextResponse.json(
        { error: 'Both not-at-fault and at-fault signatures are required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = [
      'notAtFaultFirstName',
      'notAtFaultLastName',
      'atFaultFirstName', 
      'atFaultLastName'
    ];
    
    const missingFields = requiredFields.filter(field => !submissionData[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate PDF with form data and signatures
    const pdfData = await generateAuthorityToActPDF(submissionData, tokenData);
    
    // Upload the signed document using the API
    const fileName = `authority-to-act-${tokenData.case_id}-${Date.now()}.pdf`;
    
    // Create form data for the upload API
    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([pdfData], { type: 'application/pdf' }));
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
    const documentUrl = uploadResult.url;
    
    // Update signature token status
    await updateSignatureTokenStatus(token, 'completed', {
      submitted_at: new Date().toISOString(),
      document_url: documentUrl,
      form_data: submissionData
    });
    
    console.log('✅ Authority to Act form submitted successfully:', {
      token,
      caseId: tokenData.case_id,
      documentUrl
    });
    
    return NextResponse.json({
      success: true,
      message: 'Authority to Act form submitted successfully',
      documentUrl,
      submittedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error submitting Authority to Act form:', error);
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}

// Generate PDF for Authority to Act form
async function generateAuthorityToActPDF(formData: any, tokenData: any): Promise<Blob> {
  // This is a mock implementation
  // In production, you would use a PDF generation library like PDFKit, jsPDF, or Puppeteer
  
  console.log('🔄 Generating Authority to Act PDF with data:', {
    caseId: tokenData.case_id,
    notAtFaultParty: `${formData.notAtFaultFirstName} ${formData.notAtFaultLastName}`,
    atFaultParty: `${formData.atFaultFirstName} ${formData.atFaultLastName}`,
    caseReference: formData.caseReference,
    accidentDate: formData.accidentDate,
    hasSignatures: !!(formData.notAtFaultSignature && formData.atFaultSignature)
  });
  
  // Mock PDF content
  const pdfContent = `
    AUTHORITY TO ACT FORM - WHITE POINTER RECOVERIES PTY LTD
    ========================================================
    
    Case Reference: ${formData.caseReference || 'N/A'}
    Case ID: ${tokenData.caseId}
    Date Generated: ${new Date().toLocaleDateString()}
    
    NOT AT FAULT PARTY DETAILS:
    ---------------------------
    Name: ${formData.notAtFaultFirstName} ${formData.notAtFaultLastName}
    Accident Date: ${formData.accidentDate || 'N/A'}
    Vehicle Rego: ${formData.regoNumber || 'N/A'}
    Insurance Company: ${formData.insuranceCompany || 'N/A'}
    Claim Number: ${formData.claimNumber || 'N/A'}
    Signature Date: ${formData.notAtFaultSignatureDate || 'N/A'}
    
    AT FAULT PARTY DETAILS:
    -----------------------
    Name: ${formData.atFaultFirstName} ${formData.atFaultLastName}
    Vehicle Rego: ${formData.atFaultRegoNumber || 'N/A'}
    Insurance Company: ${formData.atFaultInsuranceCompany || 'N/A'}
    Claim Number: ${formData.atFaultClaimNumber || 'N/A'}
    Signature Date: ${formData.atFaultSignatureDate || 'N/A'}
    
    SIGNATURES:
    -----------
    Not At Fault Signature: ${formData.notAtFaultSignature ? 'PRESENT' : 'MISSING'}
    At Fault Signature: ${formData.atFaultSignature ? 'PRESENT' : 'MISSING'}
    
    This document was generated electronically and contains digital signatures.
  `;
  
  // Convert to blob (in production, this would be actual PDF generation)
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  
  console.log('✅ Authority to Act PDF generated successfully');
  return blob;
}
