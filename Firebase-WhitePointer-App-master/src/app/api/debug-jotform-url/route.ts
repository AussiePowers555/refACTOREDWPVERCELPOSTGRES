import { NextRequest, NextResponse } from 'next/server';
import { buildJotFormURL } from '@/lib/jotform';
import { validateJotFormURL } from '@/lib/jotform-field-inspector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType = 'claims', caseData } = body;

    // Use test case data if none provided
    const testCaseData = caseData || {
      caseNumber: '2025-001',
      clientName: 'John Smith',
      clientEmail: 'whitepointer2016@gmail.com',
      clientPhone: '555-1111',
      clientStreetAddress: '123 Main St',
      clientSuburb: 'Anytown',
      clientState: 'NSW',
      clientPostcode: '2000',
      clientInsuranceCompany: 'AllState',
      clientClaimNumber: 'C001',
      atFaultPartyName: 'Jane Doe',
      atFaultPartyEmail: 'jane.doe@example.com',
      atFaultPartyPhone: '555-2222',
      atFaultPartyInsuranceCompany: 'Geico',
      atFaultPartyClaimNumber: 'AF001',
      accidentDescription: 'Rear-end collision at intersection',
      accidentLocation: 'Main St & Oak Ave',
      lawyer: 'Smith & Co Lawyers',
      rentalCompany: 'PBikeRescue Rentals'
    };

    console.log('🔍 DEBUGGING JOTFORM URL GENERATION:');
    console.log('📋 Document Type:', documentType);
    console.log('📊 Test Case Data:', JSON.stringify(testCaseData, null, 2));

    // Generate the JotForm URL
    const token = `debug-token-${Date.now()}`;
    const jotFormURL = buildJotFormURL(documentType, testCaseData, token);

    console.log('🔗 Generated JotForm URL:', jotFormURL);

    // Parse and analyze the URL
    const urlObj = new URL(jotFormURL);
    const params = urlObj.searchParams;
    
    const urlAnalysis = {
      baseUrl: `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`,
      parameterCount: params.size,
      parameters: {} as Record<string, string>
    };

    // Extract all parameters
    for (const [key, value] of params.entries()) {
      urlAnalysis.parameters[key] = value;
      console.log(`  ${key} = ${value}`);
    }

    // Validate the URL
    const validation = validateJotFormURL(jotFormURL);

    return NextResponse.json({
      success: true,
      documentType,
      caseData: testCaseData,
      generatedUrl: jotFormURL,
      urlAnalysis,
      validation,
      recommendations: generateRecommendations(validation, urlAnalysis)
    });

  } catch (error) {
    console.error('Error in debug-jotform-url API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate debug URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(validation: any, urlAnalysis: any): string[] {
  const recommendations: string[] = [];

  if (!validation.hasFieldIds) {
    recommendations.push('URL does not contain numeric field IDs - prefilling may not work correctly');
  }

  if (validation.fieldCount === 0) {
    recommendations.push('No URL parameters found - form will be completely blank');
  }

  if (validation.fieldCount < 5) {
    recommendations.push('Very few parameters found - most fields will be empty');
  }

  if (validation.issues.length > 0) {
    recommendations.push(`Issues found: ${validation.issues.join(', ')}`);
  }

  // Check for common field patterns
  const hasClientName = Object.keys(urlAnalysis.parameters).some(key => 
    key.includes('name') || key.includes('client') || key.includes('driver')
  );
  
  if (!hasClientName) {
    recommendations.push('No client name field detected in URL parameters');
  }

  const hasEmail = Object.keys(urlAnalysis.parameters).some(key => 
    key.includes('email')
  );
  
  if (!hasEmail) {
    recommendations.push('No email field detected in URL parameters');
  }

  if (recommendations.length === 0) {
    recommendations.push('URL looks good - should prefill correctly');
  }

  return recommendations;
}
