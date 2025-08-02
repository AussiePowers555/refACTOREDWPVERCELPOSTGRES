import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  try {
    console.log(`🗑️ Starting to delete case: ${id}`);

    // Get case details first
    const caseData = DatabaseService.getCaseById(id);
    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Clean up associated files
    try {
      // Delete uploaded documents directory
      const documentsDir = path.join(process.cwd(), 'public/uploads/documents', id);
      if (fs.existsSync(documentsDir)) {
        fs.rmSync(documentsDir, { recursive: true, force: true });
        console.log(`🗑️ Deleted documents directory for case ${id}`);
      }

      // Delete any signature tokens for this case
      DatabaseService.deleteSignatureTokensByCase(id);
      console.log(`🗑️ Deleted signature tokens for case ${id}`);
      
      // Delete any digital signatures for this case
      DatabaseService.deleteDigitalSignaturesByCase(id);
      console.log(`🗑️ Deleted digital signatures for case ${id}`);

    } catch (cleanupError) {
      console.error(`⚠️ Error during cleanup for case ${id}:`, cleanupError);
      // Continue with case deletion even if cleanup fails
    }

    // Delete the case from database
    const deleted = DatabaseService.deleteCase(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete case from database' },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully deleted case ${id} and cleaned up associated files`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted case ${caseData.caseNumber} and cleaned up associated files`,
      deletedCase: {
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        clientName: caseData.clientName
      }
    });

  } catch (error) {
    console.error(`❌ Error deleting case ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete case', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
