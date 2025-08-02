import { put, del, list, head } from '@vercel/blob';

export interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType?: string;
}

export class VercelBlobService {
  private static instance: VercelBlobService;

  private constructor() {}

  static getInstance(): VercelBlobService {
    if (!VercelBlobService.instance) {
      VercelBlobService.instance = new VercelBlobService();
    }
    return VercelBlobService.instance;
  }

  /**
   * Upload a file to Vercel Blob storage
   */
  async uploadFile(
    filename: string,
    data: Buffer | Uint8Array | string,
    contentType?: string,
    folder?: string
  ): Promise<BlobFile> {
    try {
      const pathname = folder ? `${folder}/${filename}` : filename;
      
      const blob = await put(pathname, data, {
        access: 'public',
        contentType: contentType || 'application/octet-stream',
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        contentType: contentType,
      };
    } catch (error) {
      console.error('Error uploading file to Vercel Blob:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a PDF file specifically
   */
  async uploadPDF(filename: string, pdfBuffer: Buffer, folder: string = 'pdfs'): Promise<BlobFile> {
    return this.uploadFile(filename, pdfBuffer, 'application/pdf', folder);
  }

  /**
   * Delete a file from Vercel Blob storage
   */
  async deleteFile(url: string): Promise<void> {
    try {
      await del(url);
    } catch (error) {
      console.error('Error deleting file from Vercel Blob:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in a specific folder
   */
  async listFiles(prefix?: string, limit: number = 100): Promise<BlobFile[]> {
    try {
      const { blobs } = await list({
        prefix,
        limit,
      });

      return blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        contentType: blob.contentType,
      }));
    } catch (error) {
      console.error('Error listing files from Vercel Blob:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(url: string): Promise<BlobFile | null> {
    try {
      const info = await head(url);
      
      return {
        url: info.url,
        pathname: info.pathname,
        size: info.size,
        uploadedAt: info.uploadedAt,
        contentType: info.contentType,
      };
    } catch (error) {
      console.error('Error getting file info from Vercel Blob:', error);
      return null;
    }
  }

  /**
   * Generate a unique filename with timestamp
   */
  generateUniqueFilename(originalName: string, prefix?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    const filename = `${nameWithoutExt}-${timestamp}.${extension}`;
    return prefix ? `${prefix}-${filename}` : filename;
  }

  /**
   * Upload file with automatic unique naming
   */
  async uploadFileWithUniqueNaming(
    originalFilename: string,
    data: Buffer | Uint8Array | string,
    contentType?: string,
    folder?: string,
    prefix?: string
  ): Promise<BlobFile> {
    const uniqueFilename = this.generateUniqueFilename(originalFilename, prefix);
    return this.uploadFile(uniqueFilename, data, contentType, folder);
  }
}

// Export a singleton instance
export const blobStorage = VercelBlobService.getInstance();

// Export commonly used functions for convenience
export const uploadFile = (filename: string, data: Buffer | Uint8Array | string, contentType?: string, folder?: string) => 
  blobStorage.uploadFile(filename, data, contentType, folder);

export const uploadPDF = (filename: string, pdfBuffer: Buffer, folder?: string) => 
  blobStorage.uploadPDF(filename, pdfBuffer, folder);

export const deleteFile = (url: string) => 
  blobStorage.deleteFile(url);

export const listFiles = (prefix?: string, limit?: number) => 
  blobStorage.listFiles(prefix, limit);

export const getFileInfo = (url: string) => 
  blobStorage.getFileInfo(url);