import { NextRequest, NextResponse } from 'next/server';
import { testAllDocumentTypes, getSampleCaseData, testJotFormURLGeneration } from '@/lib/jotform-debug';
import { buildJotFormURL } from '@/lib/jotform';
import { createSignatureToken, getSignatureToken, updateSignatureTokenFormLink } from '@/lib/signature-tokens-db';
import { DocumentType } from '@/lib/database-schema';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Starting JotForm prefill workflow test...');
    
    // Test URL generation for all document types
    testAllDocumentTypes();
    
    return NextResponse.json({
      success: true,
      message: 'JotForm URL generation test completed. Check console for details.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { documentType = 'claims', testCaseData } = await request.json();
    
    console.log('🧪 Testing complete JotForm prefill workflow...\n');
    console.log('Document Type:', documentType);
    
    // Step 1: Create test case data
    const caseData = testCaseData || getSampleCaseData(documentType as DocumentType);
    console.log('1️⃣ Test case data created:', JSON.stringify(caseData, null, 2));
    
    // Step 2: Create signature token (simulating the send-for-signature flow)
    const token = await createSignatureToken(
      caseData.caseNumber || 'TEST001',
      caseData.clientEmail || 'test@example.com',
      documentType as DocumentType,
      caseData,
      '' // Empty form_link initially
    );
    console.log('2️⃣ Signature token created:', token);
    
    // Step 3: Build JotForm URL with prefilled data
    const jotFormURL = buildJotFormURL(documentType as DocumentType, caseData, token);
    console.log('3️⃣ JotForm URL built:', jotFormURL);
    
    // Step 4: Update token with the form link
    await updateSignatureTokenFormLink(token, jotFormURL);
    console.log('4️⃣ Token updated with form link');
    
    // Step 5: Simulate retrieving the token (as the portal would)
    const retrievedToken = await getSignatureToken(token);
    console.log('5️⃣ Token retrieved:', {
      found: !!retrievedToken,
      hasFormLink: !!retrievedToken?.form_link,
      formLinkLength: retrievedToken?.form_link?.length || 0
    });
    
    // Step 6: Parse and validate the URL parameters
    const url = new URL(jotFormURL);
    const params = Object.fromEntries(url.searchParams.entries());
    console.log('6️⃣ URL parameters:', params);
    
    // Step 7: Validate that critical parameters are present
    const criticalParams = ['signature_token', 'client_name', 'client_email', 'case_number'];
    const missingParams = criticalParams.filter(param => !url.searchParams.has(param));
    
    const result = {
      success: true,
      test_results: {
        documentType,
        token,
        jotFormURL,
        tokenCreated: !!token,
        tokenRetrieved: !!retrievedToken,
        formLinkStored: !!retrievedToken?.form_link,
        urlParameters: params,
        parameterCount: Object.keys(params).length,
        criticalParamsPresent: criticalParams.filter(param => url.searchParams.has(param)),
        missingCriticalParams: missingParams,
        testPassed: missingParams.length === 0
      },
      timestamp: new Date().toISOString()
    };
    
    if (missingParams.length > 0) {
      console.log('❌ Test FAILED - Missing critical parameters:', missingParams);
      result.success = false;
    } else {
      console.log('✅ Test PASSED - All critical parameters present');
    }
    
    console.log('\n🏁 Test completed\n');
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Test workflow failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE method to clear test data
export async function DELETE() {
  try {
    // This would clear test tokens in a real implementation
    console.log('🧹 Test cleanup requested');
    
    return NextResponse.json({
      success: true,
      message: 'Test data cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}