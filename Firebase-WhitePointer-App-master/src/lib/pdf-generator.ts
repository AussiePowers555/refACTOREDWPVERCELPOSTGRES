import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DigitalSignatureService } from '@/lib/digital-signature-service';
import { blobStorage } from '@/lib/vercel-blob';
import type { CaseDetails, DocumentMetadata } from '@/lib/utils';

interface ClaimsFormData {
  // Panel Shop
  panelShopName?: string;
  panelShopContact?: string;
  panelShopPhone?: string;
  repairStartDate?: string;
  vehicleCondition?: string[];

  // Client/Driver
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientPostcode?: string;

  // Owner
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;

  // Insurance
  insuranceCompany?: string;
  claimNumber?: string;

  // Vehicle
  make?: string;
  model?: string;
  year?: string;
  rego?: string;

  // At-fault party
  afDriverName?: string;
  afDriverPhone?: string;
  afDriverEmail?: string;
  afDriverAddress?: string;
  afOwnerName?: string;
  afOwnerPhone?: string;
  afOwnerEmail?: string;
  afInsuranceCompany?: string;
  afClaimNumber?: string;
  afMake?: string;
  afModel?: string;
  afYear?: string;
  afRego?: string;

  // Accident details
  accidentDetails?: string;
  accidentLocation?: string;
  injuries?: boolean;

  // Case info
  caseNumber?: string;
  signature?: string;
}

export async function generateClaimsFormPDF(
  formData: ClaimsFormData,
  signatureDataURL?: string
): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  
  // Get fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  let yPosition = height - 50;
  
  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    page.drawText(text, {
      x,
      y,
      size: options.size || 10,
      font: options.bold ? boldFont : font,
      color: rgb(0, 0, 0),
      ...options
    });
  };
  
  // Helper function to add section
  const addSection = (title: string, fields: Array<{label: string, value?: string}>) => {
    // Section title
    addText(title, 50, yPosition, { size: 14, bold: true });
    yPosition -= 25;
    
    // Fields
    fields.forEach(field => {
      if (field.value) {
        addText(`${field.label}: ${field.value}`, 70, yPosition, { size: 10 });
        yPosition -= 15;
      }
    });
    
    yPosition -= 10; // Extra space between sections
  };
  
  // Title
  addText('CLAIMS FORM', width / 2 - 60, yPosition, { size: 18, bold: true });
  yPosition -= 20;
  addText('Not At Fault Accident Replacement Vehicles', width / 2 - 120, yPosition, { size: 12 });
  yPosition -= 30;
  
  if (formData.caseNumber) {
    addText(`Case Number: ${formData.caseNumber}`, 50, yPosition, { size: 12, bold: true });
    yPosition -= 30;
  }
  
  // Panel Shop Section
  addSection('PANEL SHOP', [
    { label: 'Panel Shop Name', value: formData.panelShopName },
    { label: 'Contact', value: formData.panelShopContact },
    { label: 'Phone Number', value: formData.panelShopPhone },
    { label: 'Repair Start Date', value: formData.repairStartDate },
    { label: 'Vehicle Condition', value: formData.vehicleCondition?.join(', ') }
  ]);
  
  // Client/Driver Section
  addSection('CLIENT/DRIVER INFORMATION', [
    { label: 'Driver Name', value: formData.clientName },
    { label: 'Mobile No.', value: formData.clientPhone },
    { label: 'Email', value: formData.clientEmail },
    { label: 'Address', value: formData.clientAddress },
    { label: 'City', value: formData.clientCity },
    { label: 'State', value: formData.clientState },
    { label: 'Postcode', value: formData.clientPostcode }
  ]);
  
  // Owner Section (if different)
  if (formData.ownerName || formData.ownerPhone || formData.ownerEmail) {
    addSection('OWNER (if different from driver)', [
      { label: 'Owner Name', value: formData.ownerName },
      { label: 'Mobile No.', value: formData.ownerPhone },
      { label: 'Email', value: formData.ownerEmail }
    ]);
  }
  
  // Insurance Section
  addSection('INSURANCE INFORMATION', [
    { label: 'Insurance Company', value: formData.insuranceCompany },
    { label: 'Claim Number', value: formData.claimNumber }
  ]);
  
  // Vehicle Details
  addSection('VEHICLE DETAILS', [
    { label: 'Make', value: formData.make },
    { label: 'Model', value: formData.model },
    { label: 'Year', value: formData.year },
    { label: 'Rego No.', value: formData.rego }
  ]);
  
  // Check if we need a new page
  if (yPosition < 200) {
    const newPage = pdfDoc.addPage([595.28, 841.89]);
    yPosition = height - 50;
    
    // Continue on new page
    const addTextNewPage = (text: string, x: number, y: number, options: any = {}) => {
      newPage.drawText(text, {
        x,
        y,
        size: options.size || 10,
        font: options.bold ? boldFont : font,
        color: rgb(0, 0, 0),
        ...options
      });
    };
    
    const addSectionNewPage = (title: string, fields: Array<{label: string, value?: string}>) => {
      addTextNewPage(title, 50, yPosition, { size: 14, bold: true });
      yPosition -= 25;
      
      fields.forEach(field => {
        if (field.value) {
          addTextNewPage(`${field.label}: ${field.value}`, 70, yPosition, { size: 10 });
          yPosition -= 15;
        }
      });
      
      yPosition -= 10;
    };
    
    // At-fault party section
    addSectionNewPage('AT-FAULT PARTY', [
      { label: 'Driver Name', value: formData.afDriverName },
      { label: 'Mobile No.', value: formData.afDriverPhone },
      { label: 'Email', value: formData.afDriverEmail },
      { label: 'Address', value: formData.afDriverAddress },
      { label: 'Owner Name', value: formData.afOwnerName },
      { label: 'Owner Mobile', value: formData.afOwnerPhone },
      { label: 'Owner Email', value: formData.afOwnerEmail },
      { label: 'Insurance Company', value: formData.afInsuranceCompany },
      { label: 'Claim Number', value: formData.afClaimNumber },
      { label: 'Make', value: formData.afMake },
      { label: 'Model', value: formData.afModel },
      { label: 'Year', value: formData.afYear },
      { label: 'Rego No.', value: formData.afRego }
    ]);
    
    // Accident Details
    addSectionNewPage('ACCIDENT DETAILS', [
      { label: 'Accident Details', value: formData.accidentDetails },
      { label: 'Accident Location', value: formData.accidentLocation },
      { label: 'Injuries', value: formData.injuries ? 'Yes' : 'No' }
    ]);
    
    // Signature section
    if (signatureDataURL) {
      addTextNewPage('SIGNATURE', 50, yPosition, { size: 14, bold: true });
      yPosition -= 30;
      
      try {
        // Convert signature data URL to image
        const signatureImageBytes = Uint8Array.from(
          atob(signatureDataURL.split(',')[1]), 
          c => c.charCodeAt(0)
        );
        const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
        
        // Add signature to PDF
        newPage.drawImage(signatureImage, {
          x: 70,
          y: yPosition - 60,
          width: 200,
          height: 60
        });
        
        yPosition -= 80;
        addTextNewPage(`Signed on: ${new Date().toLocaleDateString()}`, 70, yPosition, { size: 10 });
      } catch (error) {
        console.error('Error embedding signature:', error);
        addTextNewPage('Signature: [Digital signature provided]', 70, yPosition, { size: 10 });
      }
    }
  }
  
  // Generate PDF bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function generateSignedPDFBlob(
  formData: ClaimsFormData,
  caseDetails: CaseDetails,
  signatureDataURL?: string
): Promise<{ blob: Blob, metadata: DocumentMetadata, blobUrl?: string }> {
  const pdfBytes = await generateClaimsFormPDF(formData, signatureDataURL);
  
  // Handle encryption differently on client vs server
  let encryptedData: Buffer | Uint8Array;
  let hash: string;
  let blobUrl: string | undefined;
  
  if (typeof window === 'undefined') {
    // Server-side: Use DigitalSignatureService for real encryption
    const bufferData = Buffer.from(pdfBytes);
    encryptedData = DigitalSignatureService.encryptData(bufferData);
    hash = DigitalSignatureService.generateHash(encryptedData as Buffer);
    
    // Upload to Vercel Blob storage
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `signed-agreement-${caseDetails.id}-${timestamp}.pdf`;
      const folder = `cases/${caseDetails.id}/documents/signed`;
      
      const uploadResult = await blobStorage.uploadPDF(filename, encryptedData as Buffer, folder);
      blobUrl = uploadResult.url;
      
      console.log(`✅ PDF uploaded to Vercel Blob: ${blobUrl}`);
    } catch (error) {
      console.error('❌ Failed to upload PDF to Vercel Blob:', error);
      // Continue without blob URL - fallback to blob response
    }
  } else {
    // Client-side: Skip encryption (will be done server-side)
    // This is a placeholder - actual encryption happens on the server
    encryptedData = Buffer.from(pdfBytes);
    hash = '';
  }

  const metadata: DocumentMetadata = {
    caseId: caseDetails.id,
    documentType: 'signed_agreement',
    storagePath: blobUrl || `contacts/${caseDetails.clientId}/cases/${caseDetails.id}/documents/signed/${Date.now()}.pdf`,
    signedAt: new Date().toISOString(),
    encryption: {
      algorithm: 'RSA-4096',
      iv: '', // RSA doesn't use IV
      keyVersion: process.env.ENCRYPTION_KEY_VERSION || '1'
    },
    hash: hash
  };

  return {
    blob: new Blob([encryptedData], { type: 'application/pdf' }),
    metadata,
    blobUrl
  };
}
