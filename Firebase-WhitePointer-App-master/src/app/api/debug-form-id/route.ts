import { NextRequest, NextResponse } from 'next/server';

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY || 'b95c9778dc855d85aa8de88badacd837';
const JOTFORM_API_BASE = 'https://api.jotform.com';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const formId = searchParams.get('formId') || '233241680987464'; // Default to the problematic form ID
  
  try {
    console.log(`🔍 [DEBUG] Testing form ID: ${formId}`);
    
    // Test basic form access
    const formResponse = await fetch(`${JOTFORM_API_BASE}/form/${formId}?apikey=${JOTFORM_API_KEY}`);
    console.log(`📡 [DEBUG] Form API response status: ${formResponse.status} ${formResponse.statusText}`);
    
    if (!formResponse.ok) {
      const errorText = await formResponse.text();
      return NextResponse.json({
        success: false,
        formId,
        error: `Form API failed: ${formResponse.status} ${formResponse.statusText}`,
        details: errorText,
        timestamp: new Date().toISOString()
      });
    }
    
    const formData = await formResponse.json();
    console.log(`✅ [DEBUG] Form data retrieved:`, {
      id: formData.content?.id,
      title: formData.content?.title,
      status: formData.content?.status,
      username: formData.content?.username
    });
    
    // Test questions/fields access
    const questionsResponse = await fetch(`${JOTFORM_API_BASE}/form/${formId}/questions?apikey=${JOTFORM_API_KEY}`);
    console.log(`📡 [DEBUG] Questions API response status: ${questionsResponse.status} ${questionsResponse.statusText}`);
    
    let questionsData = null;
    if (questionsResponse.ok) {
      questionsData = await questionsResponse.json();
      console.log(`✅ [DEBUG] Questions data retrieved: ${Object.keys(questionsData.content || {}).length} fields`);
    } else {
      const errorText = await questionsResponse.text();
      console.error(`❌ [DEBUG] Questions API failed:`, errorText);
    }
    
    return NextResponse.json({
      success: true,
      formId,
      form: {
        id: formData.content?.id,
        title: formData.content?.title,
        status: formData.content?.status,
        username: formData.content?.username,
        url: formData.content?.url,
        created_at: formData.content?.created_at,
        updated_at: formData.content?.updated_at
      },
      questions: {
        available: questionsResponse.ok,
        count: questionsData ? Object.keys(questionsData.content || {}).length : 0,
        status: questionsResponse.status
      },
      rawResponses: {
        formStatus: formResponse.status,
        questionsStatus: questionsResponse.status
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ [DEBUG] Error testing form ID ${formId}:`, error);
    
    return NextResponse.json({
      success: false,
      formId,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { formIds } = await request.json();
    
    if (!formIds || !Array.isArray(formIds)) {
      return NextResponse.json({
        success: false,
        error: 'formIds array is required'
      }, { status: 400 });
    }
    
    const results: { [key: string]: any } = {};
    
    for (const formId of formIds) {
      try {
        console.log(`🔍 [DEBUG] Testing form ID: ${formId}`);
        
        const formResponse = await fetch(`${JOTFORM_API_BASE}/form/${formId}?apikey=${JOTFORM_API_KEY}`);
        
        if (formResponse.ok) {
          const formData = await formResponse.json();
          results[formId] = {
            success: true,
            form: formData.content,
            accessible: true
          };
        } else {
          const errorText = await formResponse.text();
          results[formId] = {
            success: false,
            error: `${formResponse.status} ${formResponse.statusText}`,
            details: errorText,
            accessible: false
          };
        }
        
      } catch (error) {
        results[formId] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          accessible: false
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}