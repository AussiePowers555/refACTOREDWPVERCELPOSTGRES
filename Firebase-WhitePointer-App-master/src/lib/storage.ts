import fs from 'fs/promises';
import path from 'path';

export class StorageService {
  static async getFile(fileName: string) {
    const filePath = path.join(process.cwd(), 'uploads', fileName);
    return {
      save: async (buffer: Buffer) => {
        await fs.writeFile(filePath, buffer);
        return { publicUrl: `/uploads/${fileName}` };
      }
    };
  }

  static async deleteFile(fileName: string) {
    const filePath = path.join(process.cwd(), 'uploads', fileName);
    await fs.unlink(filePath);
  }
}