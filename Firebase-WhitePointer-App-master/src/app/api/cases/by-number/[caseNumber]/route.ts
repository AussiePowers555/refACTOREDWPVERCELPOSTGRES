import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, initializeDatabase } from '@/lib/database';


export async function GET(
  request: NextRequest,
  context: { params: { caseNumber: string } }
) {
  try {
    // Initialize database if needed
    initializeDatabase();

    const { caseNumber } = context.params;
    
    // Validate case number
    if (!caseNumber || caseNumber === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid case number' },
        { status: 400 }
      );
    }
    
    const caseData = await DatabaseService.getCaseByCaseNumber(caseNumber as string);
    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Ensure we have the case ID
    const caseId = caseData.id;
    if (!caseId) {
      return NextResponse.json(
        { error: 'Invalid case data' },
        { status: 400 }
      );
    }
    return NextResponse.json(caseData);
  } catch (error) {
    console.error('Error fetching case by number:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { caseNumber: string } }
) {
  try {
    // Initialize database if needed
    initializeDatabase();

    const { caseNumber } = context.params;
    const updates = await request.json();
    
    // First find the case by caseNumber to get its ID
    const existingCase = await DatabaseService.getCaseByCaseNumber(caseNumber);
    if (!existingCase || !existingCase.id) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Update using the case ID
        await DatabaseService.updateCase(existingCase.id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating case by number:', error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}