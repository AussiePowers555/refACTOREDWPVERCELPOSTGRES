// This service is intended for server-side use only
// Do not import this in client-side components

import { DatabaseService } from './database';
import { SignedDocument } from './database-schema';
import { PDFDocument, rgb } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

// Type definitions
interface SignatureData {
  base64: string;
  vectorPoints: number[];
}

// Helper functions for server-side only
const getServerSideCrypto = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Crypto functions are only available on the server side');
  }
  return require('crypto');
};

const getServerSideFs = () => {
  if (typeof window !== 'undefined') {
    throw new Error('File system functions are only available on the server side');
  }
  return require('fs');
};

const getServerSidePath = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Path functions are only available on the server side');
  }
  return require('path');
};

export class DigitalSignatureService {
  private static keyPair: any = null;

  private static initializeKeyPair() {
    if (this.keyPair === null && typeof window === 'undefined') {
      const crypto = getServerSideCrypto();
      this.keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
    }
  }

  static async createSignedDocument(
    caseId: string,
    documentType: string,
    signerName: string,
    signatureData: SignatureData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SignedDocument> {
    // Ensure this is only called on the server
    if (typeof window !== 'undefined') {
      throw new Error('createSignedDocument can only be called on the server side');
    }

    try {
      // Initialize key pair if needed
      this.initializeKeyPair();
      
      const fs = getServerSideFs();
      const path = getServerSidePath();
      const crypto = getServerSideCrypto();
      
      // Generate document ID and paths
      const docId = uuidv4();
      const docDir = path.join('documents', caseId, 'signed');
      const docPath = path.join(docDir, `${docId}.pdf`);
      
      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      
      // Add document content
      page.drawText(`Signed Document - ${documentType}`, { x: 50, y: 750, size: 20 });
      page.drawText(`Case ID: ${caseId}`, { x: 50, y: 700, size: 12 });
      page.drawText(`Signed by: ${signerName}`, { x: 50, y: 680, size: 12 });
      page.drawText(`Date: ${new Date().toISOString()}`, { x: 50, y: 660, size: 12 });
      
      // Add signature image
      const signatureBytes = Buffer.from(signatureData.base64.split(',')[1], 'base64');
      const signatureImage = await pdfDoc.embedPng(signatureBytes);
      page.drawImage(signatureImage, { x: 50, y: 600, width: 200, height: 80 });
      
      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const encryptedPdf = this.encryptData(Buffer.from(pdfBytes));
      
      // Ensure directory exists
      if (!fs.existsSync(docDir)) {
        fs.mkdirSync(docDir, { recursive: true });
      }
      
      // Save file
      fs.writeFileSync(docPath, encryptedPdf);
      
      // Create document record
      const signedDoc: SignedDocument = {
        id: docId,
        caseId,
        documentType: documentType as any,
        fileName: `${documentType}-${new Date().toISOString().split('T')[0]}.pdf`,
        filePath: docPath,
        fileSize: pdfBytes.length,
        sha256Hash: this.generateHash(Buffer.from(pdfBytes)),
        signedAt: new Date().toISOString(),
        signedBy: signerName,
        signatureData: signatureData.base64,
        ipAddress,
        userAgent,
        encryptionKeyId: 'key-' + uuidv4(),
        versions: []
      };
      
      // Save to database
      DatabaseService.createDocument(signedDoc);
      
      return signedDoc;
      
    } catch (error) {
      console.error('Error creating signed document:', error);
      throw new Error('Failed to create signed document');
    }
  }
  
  public static encryptData(data: Buffer): Buffer {
    if (typeof window !== 'undefined') {
      throw new Error('encryptData can only be called on the server side');
    }
    
    this.initializeKeyPair();
    const crypto = getServerSideCrypto();
    return crypto.publicEncrypt(this.keyPair.publicKey, data);
  }
  
  public static decryptData(encryptedData: Buffer): Buffer {
    if (typeof window !== 'undefined') {
      throw new Error('decryptData can only be called on the server side');
    }
    
    this.initializeKeyPair();
    const crypto = getServerSideCrypto();
    return crypto.privateDecrypt(this.keyPair.privateKey, encryptedData);
  }
  
  public static generateHash(data: Buffer): string {
    if (typeof window !== 'undefined') {
      // Client-side fallback - not secure but prevents errors
      // In a real app, this should always be done server-side
      return '';
    }
    
    const crypto = getServerSideCrypto();
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
