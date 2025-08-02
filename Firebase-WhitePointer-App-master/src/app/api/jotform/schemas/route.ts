import { NextRequest, NextResponse } from 'next/server';
import { fetchAllJotFormSchemas, fetchJotFormData } from '@/lib/jotform-api';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 [API] Fetching JotForm schemas for all document types...');
    console.log(`📍 [API] Request URL: ${request.url}`);
    console.log(`🕐 [API] Request timestamp: ${new Date().toISOString()}`);

    // Fetch all form schemas using the API utility
    const schemas = await fetchAllJotFormSchemas();
    
    const duration = Date.now() - startTime;
    const schemaKeys = Object.keys(schemas);
    const metadata = (schemas as any)._metadata;
    
    console.log(`✅ [API] Successfully fetched schemas in ${duration}ms`);
    console.log(`📊 [API] Schema summary:`, {
      availableTypes: schemaKeys,
      totalSchemas: schemaKeys.length,
      metadata: metadata ? {
        successCount: metadata.successCount,
        totalCount: metadata.totalCount,
        errors: metadata.errors ? Object.keys(metadata.errors) : []
      } : 'No metadata'
    });

    // Log individual schema details for debugging
    schemaKeys.forEach(type => {
      const schema = schemas[type];
      if (schema && schema.questions) {
        console.log(`📋 [API] ${type}: ${Object.keys(schema.questions).length} fields, Form ID: ${schema.form?.id}`);
      }
    });

    if (metadata?.errors && Object.keys(metadata.errors).length > 0) {
      console.warn('⚠️  [API] Some schemas failed to load:', metadata.errors);
    }

    const response = {
      success: true,
      data: schemas,
      timestamp: new Date().toISOString(),
      documentTypes: schemaKeys,
      metadata: metadata || null,
      performance: {
        duration: `${duration}ms`,
        schemasLoaded: schemaKeys.length,
        totalAttempted: metadata?.totalCount || schemaKeys.length
      }
    };

    console.log('📤 [API] Sending response with keys:', Object.keys(response));
    
    return NextResponse.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    console.error('❌ [API] Error fetching JotForm schemas:', {
      error: errorMessage,
      duration: `${duration}ms`,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined
    });
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      performance: {
        duration: `${duration}ms`,
        failed: true
      }
    }, { status: 500 });
  }
}

// Optional: Add POST method for testing specific form IDs
export async function POST(request: NextRequest) {
  try {
    const { formIds } = await request.json();
    
    if (!formIds || !Array.isArray(formIds)) {
      return NextResponse.json({
        success: false,
        error: 'formIds array is required'
      }, { status: 400 });
    }

    console.log('🔄 Fetching JotForm schemas for specific forms:', formIds);
    
    const results: { [key: string]: any } = {};
    
    for (const formId of formIds) {
      try {
        const data = await fetchJotFormData(formId);
        results[formId] = data;
      } catch (error) {
        console.error(`Failed to fetch form ${formId}:`, error);
        results[formId] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching specific JotForm schemas:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}