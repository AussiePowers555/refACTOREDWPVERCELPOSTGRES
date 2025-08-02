import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseNumber = searchParams.get('caseNumber');
    
    if (!caseNumber) {
      return NextResponse.json(
        { success: false, error: 'Case number is required' },
        { status: 400 }
      );
    }

    await ensureDatabaseInitialized();
    const interactions = await DatabaseService.getCaseInteractions(caseNumber);
    
    return NextResponse.json({
      success: true,
      interactions
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const interactionData = await request.json();
    
    // Create the interaction in the database
    const newInteraction = await DatabaseService.createCaseInteraction({
      caseNumber: interactionData.caseNumber,
      source: interactionData.source,
      method: interactionData.method,
      situation: interactionData.situation,
      action: interactionData.action,
      outcome: interactionData.outcome,
      timestamp: interactionData.timestamp || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      interaction: newInteraction
    });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}