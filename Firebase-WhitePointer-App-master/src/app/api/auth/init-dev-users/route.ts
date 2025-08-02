import { NextRequest, NextResponse } from 'next/server';
import { initializeDeveloperAccounts } from '@/lib/user-auth';
import { ensureDatabaseInitialized } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Initializing developer accounts...');

    // Ensure database is initialized first
    await ensureDatabaseInitialized();

    const developers = await initializeDeveloperAccounts();
    
    console.log(`✅ Developer accounts initialized: ${developers.length} accounts`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully initialized ${developers.length} developer accounts`,
      developers: developers.map((dev: any) => ({
        id: dev.id,
        email: dev.email,
        role: dev.role,
        status: dev.status
      }))
    });
  } catch (error) {
    console.error('❌ Error initializing developer accounts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize developer accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
