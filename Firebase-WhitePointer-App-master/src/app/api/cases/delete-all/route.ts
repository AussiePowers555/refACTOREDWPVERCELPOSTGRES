import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { DatabaseBackup } from '@/lib/database-backup';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    // CRITICAL SECURITY CHECK - This endpoint should only be used in development
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 SECURITY ALERT: Attempted to delete all cases in production!');
      return NextResponse.json(
        { error: 'DELETE ALL is disabled in production for data safety' },
        { status: 403 }
      );
    }

    // Additional safety check - require specific confirmation header
    const confirmHeader = request.headers.get('x-confirm-delete-all');
    if (confirmHeader !== 'I-UNDERSTAND-THIS-DELETES-ALL-DATA') {
      return NextResponse.json(
        { error: 'Missing required confirmation header for safety' },
        { status: 400 }
      );
    }

    console.log('🗑️ Starting to delete all cases...');
    console.log('⚠️  WARNING: This will delete ALL case data permanently!');

    // CRITICAL: Create backup before deletion
    const backupFile = DatabaseBackup.backupBeforeDeletion();
    console.log(`📦 Safety backup created: ${path.basename(backupFile)}`);

    // Get all cases first to clean up associated files
    const cases = DatabaseService.getAllCases();
    console.log(`Found ${cases.length} cases to delete`);

    // Clean up associated files for each case
    for (const caseItem of cases) {
      try {
        // Delete uploaded documents
        const documentsDir = path.join(process.cwd(), 'public/uploads/documents', caseItem.id || '');
        if (fs.existsSync(documentsDir)) {
          fs.rmSync(documentsDir, { recursive: true, force: true });
          console.log(`🗑️ Deleted documents for case ${caseItem.id}`);
        }

        // Delete any signature tokens
        if (caseItem.id) DatabaseService.deleteSignatureTokensByCase(caseItem.id);
        
        // Delete any digital signatures
        if (caseItem.id) DatabaseService.deleteDigitalSignaturesByCase(caseItem.id);
        
      } catch (error) {
        console.error(`❌ Error cleaning up case ${caseItem.id}:`, error);
      }
    }

    // Delete all cases from database
    const deletedCount = DatabaseService.deleteAllCases();
    
    console.log(`✅ Successfully deleted ${deletedCount} cases and cleaned up associated files`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} cases and cleaned up associated files`,
      deletedCount
    });

  } catch (error) {
    console.error('❌ Error deleting all cases:', error);
    return NextResponse.json(
      { error: 'Failed to delete all cases', details: (error as Error).message },
      { status: 500 }
    );
  }
}
