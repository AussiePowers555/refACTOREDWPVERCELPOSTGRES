/*
  lib/file-upload.ts
  ------------------
  File storage helper utilities supporting both local filesystem and Vercel Blob storage.

  Why this file?
  1. Centralises all Storage access logic in **one place** so future LLM
     edits are trivial (single-responsibility principle).
  2. Keeps route-handlers lean and readable.
  3. Provides fallback from Vercel Blob to local storage for development.

  Public surface (minimal but expressive):
  ---------------------------------------
  • uploadPdfToCase(pdfBuffer, caseNumber, docType)
      ‑ Saves a PDF buffer to Vercel Blob (or local fallback) and returns the public URL.

  • ensureCaseFolder(caseNumber)
      ‑ Creates the directory structure if it doesn't exist (local storage only).
        Idempotent – safe to call repeatedly.
*/
import * as fs from 'fs/promises';
import * as path from 'path';
import { blobStorage } from '@/lib/vercel-blob';

// Base upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper to upload a PDF buffer and get a download URL
export async function uploadPdfToCase(
  pdfBuffer: Buffer,
  caseNumber: string,
  docType: string
): Promise<string> {
  const fileName = `${docType}-${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
  const folder = `cases/${caseNumber}`;
  
  try {
    // Try Vercel Blob storage first
    const uploadResult = await blobStorage.uploadPDF(fileName, pdfBuffer, folder);
    console.log(`✅ PDF uploaded to Vercel Blob: ${uploadResult.url}`);
    return uploadResult.url;
  } catch (error) {
    console.warn('⚠️ Vercel Blob upload failed, falling back to local storage:', error);
    
    // Fallback to local storage
    const caseDir = path.join(UPLOAD_DIR, 'cases', caseNumber);
    await fs.mkdir(caseDir, { recursive: true });
    
    const filePath = path.join(caseDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);
    
    // Return public URL path
    return `/uploads/cases/${caseNumber}/${fileName}`;
  }
}

// Ensure a case folder exists by creating the directory
export async function ensureCaseFolder(caseNumber: string): Promise<void> {
  const caseDir = path.join(UPLOAD_DIR, 'cases', caseNumber);
  await fs.mkdir(caseDir, { recursive: true });
}

// Additional helper to upload any file type
export async function uploadFile(
  fileBuffer: Buffer,
  folder: string,
  fileName: string,
  contentType?: string
): Promise<string> {
  try {
    // Try Vercel Blob storage first
    const uploadResult = await blobStorage.uploadFile(fileName, fileBuffer, contentType, folder);
    console.log(`✅ File uploaded to Vercel Blob: ${uploadResult.url}`);
    return uploadResult.url;
  } catch (error) {
    console.warn('⚠️ Vercel Blob upload failed, falling back to local storage:', error);
    
    // Fallback to local storage
    const dirPath = path.join(UPLOAD_DIR, folder);
    await fs.mkdir(dirPath, { recursive: true });
    
    const filePath = path.join(dirPath, fileName);
    await fs.writeFile(filePath, fileBuffer);
    
    return `/uploads/${folder}/${fileName}`;
  }
}

// Helper to delete a file
export async function deleteFile(relativePath: string): Promise<void> {
  // If it looks like a Vercel Blob URL, use blob storage
  if (relativePath.startsWith('https://') && relativePath.includes('blob.vercel-storage.com')) {
    try {
      await blobStorage.deleteFile(relativePath);
      console.log(`✅ File deleted from Vercel Blob: ${relativePath}`);
      return;
    } catch (error) {
      console.warn('⚠️ Vercel Blob delete failed:', error);
      // Continue to local deletion attempt
    }
  }
  
  // Local storage deletion
  const filePath = path.join(UPLOAD_DIR, relativePath);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as any).code !== 'ENOENT') {
      throw error;
    }
  }
}

// Helper to check if file exists
export async function fileExists(relativePath: string): Promise<boolean> {
  // If it looks like a Vercel Blob URL, check blob storage
  if (relativePath.startsWith('https://') && relativePath.includes('blob.vercel-storage.com')) {
    try {
      const fileInfo = await blobStorage.getFileInfo(relativePath);
      return fileInfo !== null;
    } catch (error) {
      console.warn('⚠️ Vercel Blob file check failed:', error);
      return false;
    }
  }
  
  // Local storage check
  const filePath = path.join(UPLOAD_DIR, relativePath);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// New helper: List files in a folder (for both storage types)
export async function listFiles(folder: string, limit?: number): Promise<string[]> {
  try {
    // Try Vercel Blob storage first
    const blobFiles = await blobStorage.listFiles(folder, limit);
    return blobFiles.map(file => file.url);
  } catch (error) {
    console.warn('⚠️ Vercel Blob list failed, falling back to local storage:', error);
    
    // Fallback to local storage
    const dirPath = path.join(UPLOAD_DIR, folder);
    try {
      const files = await fs.readdir(dirPath);
      return files.map(file => `/uploads/${folder}/${file}`);
    } catch {
      return [];
    }
  }
}
