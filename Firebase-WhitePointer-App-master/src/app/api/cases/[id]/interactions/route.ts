import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized();
    
    // Get case by ID first to get the case number
    const case_ = await DatabaseService.getCaseById(params.id);
    if (!case_) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    const interactions = await DatabaseService.getCaseInteractions(case_.caseNumber);
    
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized();
    
    // Get case by ID first to get the case number
    const case_ = await DatabaseService.getCaseById(params.id);
    if (!case_) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    const interactionData = await request.json();
    
    // Create the interaction in the database
    const newInteraction = await DatabaseService.createCaseInteraction({
      caseNumber: case_.caseNumber,
      source: interactionData.source,
      method: interactionData.method,
      situation: interactionData.situation,
      action: interactionData.action,
      outcome: interactionData.outcome,
      timestamp: new Date().toISOString()
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