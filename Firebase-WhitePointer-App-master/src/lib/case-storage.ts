/**
 * Case storage service using SQLite
 */
import { DatabaseService } from './database';
import type { Case, CaseFrontend } from './database-schema';
import { SchemaTransformers } from './database-schema';

class CaseStorageService {
  async getCases(): Promise<CaseFrontend[]> {
    try {
      return await DatabaseService.getAllCases();
    } catch (error) {
      console.error('Error fetching cases from database:', error);
      return [];
    }
  }

  async getCase(caseNumber: string): Promise<CaseFrontend | null> {
    try {
      return await DatabaseService.getCaseByCaseNumber(caseNumber);
    } catch (error) {
      console.error('Error fetching case:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  async saveCase(caseData: Partial<CaseFrontend>): Promise<CaseFrontend | null> {
    try {
      if (caseData.id) {
        // This is an update
        await DatabaseService.updateCase(caseData.id, caseData);
        return await DatabaseService.getCaseById(caseData.id);
      } else {
        // This is a create - convert frontend to backend format
        const dbCase = SchemaTransformers.caseFrontendToDb(caseData as CaseFrontend);
        const created = await DatabaseService.createCase(dbCase as any);
        return created ? SchemaTransformers.caseDbToFrontend(created) : null;
      }
    } catch (error) {
      console.error('Error saving case to database:', error);
      throw error;
    }
  }

  async updateCase(caseId: string, updates: Partial<CaseFrontend>): Promise<CaseFrontend | null> {
    try {
      await DatabaseService.updateCase(caseId, updates);
      return await DatabaseService.getCaseById(caseId);
    } catch (error) {
      console.error('Error updating case in database:', error);
      throw error;
    }
  }
}

export const caseStorage = new CaseStorageService();
