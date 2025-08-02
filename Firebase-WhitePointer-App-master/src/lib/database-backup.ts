import { DatabaseService } from './database';
import fs from 'fs';
import path from 'path';

export class DatabaseBackup {
  private static backupDir = path.join(process.cwd(), 'data', 'backups');

  static ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  static createBackup(label: string = 'auto'): string {
    if (typeof window !== 'undefined') {
      throw new Error('Backup operations must be performed server-side only');
    }

    this.ensureBackupDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${label}-${timestamp}.json`);
    
    try {
      // Get all data from the database
      const backup = {
        timestamp: new Date().toISOString(),
        label,
        data: {
          cases: DatabaseService.getAllCases(),
          contacts: DatabaseService.getAllContacts(),
          workspaces: DatabaseService.getAllWorkspaces(),
          bikes: DatabaseService.getBikes(),
          userAccounts: DatabaseService.getAllUserAccounts()
        }
      };

      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      console.log(`✅ Database backup created: ${backupFile}`);
      
      // Keep only last 10 backups
      this.cleanOldBackups();
      
      return backupFile;
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }

  static cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stat: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

      // Keep only the 10 most recent backups
      const filesToDelete = files.slice(10);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Deleted old backup: ${file.name}`);
      }
    } catch (error) {
      console.error('❌ Error cleaning old backups:', error);
    }
  }

  static listBackups(): string[] {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }
    
    return fs.readdirSync(this.backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .sort()
      .reverse();
  }

  static restoreFromBackup(backupFileName: string): boolean {
    const backupPath = path.join(this.backupDir, backupFileName);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFileName}`);
    }

    try {
      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      console.log(`🔄 Restoring from backup: ${backupFileName}`);
      console.log(`📅 Backup created: ${backupData.timestamp}`);
      
      // Create a safety backup before restore
      this.createBackup('pre-restore');
      
      // Clear existing data
      DatabaseService.deleteAllCases();
      
      // Restore cases
      for (const caseData of backupData.data.cases || []) {
        DatabaseService.createCase(caseData);
      }
      
      console.log(`✅ Restored ${backupData.data.cases?.length || 0} cases`);
      return true;
    } catch (error) {
      console.error('❌ Failed to restore backup:', error);
      throw error;
    }
  }

  // Automatic backup before dangerous operations
  static backupBeforeDeletion(): string {
    return this.createBackup('before-deletion');
  }
}