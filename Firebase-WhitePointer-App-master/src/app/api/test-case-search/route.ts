import { NextRequest, NextResponse } from 'next/server';
import { runSearchTests } from '../../(app)/cases/__tests__/search-functionality.test';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Running Case List Search Tests...\n');
    
    const results = runSearchTests();
    
    return NextResponse.json({
      success: true,
      message: 'Case search functionality tests completed',
      testResults: {
        passed: results.passed,
        total: results.total,
        passRate: `${Math.round((results.passed / results.total) * 100)}%`,
        allPassed: results.passed === results.total
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchQuery } = await request.json();
    
    if (!searchQuery) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 });
    }
    
    // Import the search function and mock data
    const { createSearchFilter, mockCases } = await import('../../(app)/cases/__tests__/search-functionality.test');
    
    const searchFilter = createSearchFilter(searchQuery);
    const results = mockCases.filter(searchFilter);
    
    return NextResponse.json({
      success: true,
      searchQuery,
      resultsCount: results.length,
      results: results.map(r => ({
        caseNumber: r.caseNumber,
        clientName: r.clientName,
        atFaultPartyName: r.atFaultPartyName,
        clientSuburb: r.clientSuburb,
        clientPostcode: r.clientPostcode,
        clientVehicleRego: r.clientVehicleRego,
        atFaultPartyVehicleRego: r.atFaultPartyVehicleRego
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Search test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Search test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}