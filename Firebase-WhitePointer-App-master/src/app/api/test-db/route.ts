import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Test basic PostgreSQL connection
    const result = await sql`SELECT NOW() as current_time, 'PostgreSQL Connected!' as message`;
    
    return NextResponse.json({
      success: true,
      message: 'PostgreSQL connection successful',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('PostgreSQL connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'PostgreSQL connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}