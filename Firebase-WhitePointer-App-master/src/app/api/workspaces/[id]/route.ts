import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized();
    const { id } = context.params;
    const updates = await request.json();
        await DatabaseService.updateWorkspace(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json({ error: 'Failed to update workspace', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized();
    const { id } = context.params;
        await DatabaseService.deleteWorkspace(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json({ error: 'Failed to delete workspace', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}