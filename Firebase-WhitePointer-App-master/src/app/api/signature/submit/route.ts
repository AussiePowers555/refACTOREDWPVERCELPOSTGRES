import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { getClientIP } from '@/lib/utils';
import { generateSignedPDFBlob } from '@/lib/pdf-generator';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { sendEmail } from '@/lib/email-service';
import fs from 'fs';
import path from 'path';

// Validation schema
const submitSchema = z.object({
  signature: z.object({
    dataUrl: z.string().startsWith('data:image/'),
    timestamp: z.string().datetime(),
    userAgent: z.string()
  }),
  fullName: z.string().min(1).max(100),
  acceptedTerms: z.boolean().refine(val => val === true),
  rentalDetails: z.object({
    make: z.string(),
    model: z.string(),
    hireDate: z.string(),
    returnDate: z.string(),
    hirerName: z.string(),
    // ... other fields as needed
  })
});

export async function POST(request: NextRequest) {
  try {
    // Get bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify CSRF token
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = submitSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { signature, fullName, acceptedTerms, rentalDetails } = validation.data;

    // Initialize database and verify token
    await ensureDatabaseInitialized();
    
    const tokenData = await DatabaseService.getSignatureToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Check if token is already used
    if (tokenData.status === 'completed') {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 401 }
      );
    }

    const caseId = tokenData.case_id;

    // Get client IP address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Create digital signature record
    const digitalSignature = await DatabaseService.createDigitalSignature({
      caseId: caseId,
      signatureTokenId: tokenData.id,
      signature_data: signature.dataUrl,
      signer_name: fullName,
      terms_accepted: acceptedTerms,
      signed_at: new Date(signature.timestamp).toISOString(),
      ip_address: ipAddress,
      user_agent: signature.userAgent
    });

    // Mark token as completed
    await DatabaseService.updateSignatureToken(tokenData.id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    // Create rental agreement record
    const rentalAgreement = await DatabaseService.createRentalAgreement({
      caseId: caseId,
      signature_id: digitalSignature.id,
      rental_details: rentalDetails,
      status: 'signed',
      signed_at: new Date().toISOString(),
      signed_by: fullName
    });

    // Update case status (if needed)
    // Note: This would require a DatabaseService.updateCase method
    console.log('Case signature completed:', { caseId, agreementId: rentalAgreement.id });

    // TODO: Generate PDF asynchronously (currently disabled due to Firebase Storage dependency)
    console.log('PDF generation temporarily disabled - would need to implement file storage');
    /*
    generateAndSendPDF({
      caseId,
      agreementId: rentalAgreement.id,
      signatureId: digitalSignature.id,
      rentalDetails,
      fullName,
      signature: signature.dataUrl,
      signedAt: new Date().toISOString()
    }).catch(error => {
      console.error('PDF generation error:', error);
      // Log error but don't fail the request
    });
    */

    // Generate and store encrypted PDF
    const caseDetails = await DatabaseService.getCaseDetails(caseId);
    // Create a CaseDetails object from CaseFrontend for PDF generation
    const caseDetailsForPdf = {
      ...caseDetails!,
      clientId: caseDetails!.id // Map id to clientId for compatibility
    };
    const { blob: pdfBlob, metadata } = await generateSignedPDFBlob(
      rentalDetails,
      caseDetailsForPdf,
      signature.dataUrl
    );

    // Store PDF in database with metadata
    const documentRecord = await DatabaseService.createDocumentRecord({
      ...metadata,
      fileName: `signed_agreement_${Date.now()}.pdf`,
      mimeType: 'application/pdf',
      size: pdfBlob.size,
      uploadedBy: fullName,
      storageService: 'encrypted_firebase'
    });

    // Update case document references
    await DatabaseService.addDocumentToCase(
      caseId,
      documentRecord.id
    );

    // Create audit trail
    await DatabaseService.createAuditLog({
      caseId,
      action: 'document_signed',
      documentId: documentRecord.id,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent: signature.userAgent,
      metadata: {
        documentType: 'signed_agreement',
        storagePath: metadata.storagePath
      }
    });

    return NextResponse.json({
      success: true,
      documentId: documentRecord.id,
      storagePath: metadata.storagePath,
      message: 'Document signed and stored successfully'
    });

  } catch (error) {
    console.error('Signature submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate and send PDF
async function generateAndSendPDF(data: {
  caseId: string;
  agreementId: string;
  signatureId: string;
  rentalDetails: any;
  fullName: string;
  signature: string;
  signedAt: string;
}) {
  try {
    // Create PDF document
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);

      // Save to local file system
      const uploadsDir = path.join(process.cwd(), 'public/uploads/documents', data.caseId);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${data.agreementId}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, pdfBuffer);

      const publicUrl = `/uploads/documents/${data.caseId}/${fileName}`;

      console.log(`✅ PDF saved to: ${filePath}`);
      console.log(`📄 Public URL: ${publicUrl}`);

      // Send email with PDF link
      await sendEmail({
        to: data.rentalDetails.email || 'default@example.com',
        subject: 'Your Signed Rental Agreement',
        html: `
          <h2>Thank you for signing your rental agreement</h2>
          <p>Dear ${data.fullName},</p>
          <p>Your rental agreement has been successfully signed and processed.</p>
          <p><a href="${publicUrl}">Download your signed agreement</a></p>
          <p>This link will expire in 7 days.</p>
          <br>
          <p>Best regards,<br>PBikeRescue Team</p>
        `
      });
    });

    // Generate PDF content
    doc.fontSize(20).text('RENTAL AGREEMENT', 50, 50);
    doc.fontSize(12);
    
    // Add rental details
    doc.text(`Agreement ID: ${data.agreementId}`, 50, 100);
    doc.text(`Case: ${data.caseId}`, 50, 120);
    doc.text(`Date: ${new Date(data.signedAt).toLocaleDateString()}`, 50, 140);
    
    doc.text('Vehicle Details:', 50, 180);
    doc.text(`Make: ${data.rentalDetails.make}`, 70, 200);
    doc.text(`Model: ${data.rentalDetails.model}`, 70, 220);
    doc.text(`Hire Date: ${data.rentalDetails.hireDate}`, 70, 240);
    doc.text(`Return Date: ${data.rentalDetails.returnDate}`, 70, 260);
    
    doc.text('Hirer Details:', 50, 300);
    doc.text(`Name: ${data.fullName}`, 70, 320);
    
    // Add signature
    doc.text('Signature:', 50, 400);
    if (data.signature) {
      const signatureData = data.signature.split(',')[1];
      const signatureBuffer = Buffer.from(signatureData, 'base64');
      doc.image(signatureBuffer, 70, 420, { width: 200, height: 100 });
    }
    
    doc.text(`Signed at: ${new Date(data.signedAt).toLocaleString()}`, 50, 540);
    
    // Add footer
    doc.fontSize(10).text('This is a legally binding document.', 50, 700);
    
    doc.end();
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}