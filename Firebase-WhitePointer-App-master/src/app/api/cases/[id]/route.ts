import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, initializeDatabase } from '@/lib/database';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Initialize database if needed
    await initializeDatabase();

    const { id } = context.params;
    const caseData = await DatabaseService.getCaseById(id);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    return NextResponse.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Initialize database if needed
    await initializeDatabase();

    const { id } = context.params;
    const updates = await request.json();
    DatabaseService.updateCase(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Initialize database if needed
    await initializeDatabase();

    const { id } = context.params;
    DatabaseService.deleteCase(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}