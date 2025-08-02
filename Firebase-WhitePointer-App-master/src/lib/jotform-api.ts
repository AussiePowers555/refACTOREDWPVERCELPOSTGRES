/**
 * JotForm API utilities to fetch form schemas and field definitions
 */

import { fallbackSchemas } from './jotform-fallback-schemas';

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY || 'b95c9778dc855d85aa8de88badacd837';
const JOTFORM_API_BASE = 'https://api.jotform.com';

export interface JotFormField {
  qid: string;
  type: string;
  text: string;
  name: string;
  required?: string;
  readonly?: string;
  size?: string;
  validation?: string;
  order?: string;
  labelAlign?: string;
  hint?: string;
  options?: string;
  special?: string;
}

export interface JotFormSchema {
  id: string;
  username: string;
  title: string;
  height: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_submission: string;
  new: string;
  count: string;
  type: string;
  favorite: string;
  archived: string;
  url: string;
}

export interface JotFormQuestions {
  [key: string]: JotFormField;
}

/**
 * Fetch JotForm details including questions/fields
 */
export async function fetchJotFormData(formId: string): Promise<{
  form: JotFormSchema;
  questions: JotFormQuestions;
}> {
  try {
    console.log(`Fetching JotForm data for form ID: ${formId}`);
    
    // Fetch form details with timeout
    const formResponse = await fetch(`${JOTFORM_API_BASE}/form/${formId}?apikey=${JOTFORM_API_KEY}`, {
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    if (!formResponse.ok) {
      throw new Error(`Failed to fetch form ${formId}: ${formResponse.status} ${formResponse.statusText}`);
    }
    const formData = await formResponse.json();

    // Fetch form questions/fields with timeout
    const questionsResponse = await fetch(`${JOTFORM_API_BASE}/form/${formId}/questions?apikey=${JOTFORM_API_KEY}`, {
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    if (!questionsResponse.ok) {
      throw new Error(`Failed to fetch questions for form ${formId}: ${questionsResponse.status} ${questionsResponse.statusText}`);
    }
    const questionsData = await questionsResponse.json();

    return {
      form: formData.content,
      questions: questionsData.content
    };
  } catch (error) {
    console.error(`Error fetching JotForm data for ${formId}:`, error);
    throw error;
  }
}

/**
 * Fetch all JotForm schemas for our document types
 */
export async function fetchAllJotFormSchemas() {
  const formIds = {
    'claims': '232543267390861',
    'not-at-fault-rental': '233241680987464',
    'certis-rental': '233238940095055',
    'authority-to-act': '233183619631457',
    'direction-to-pay': '233061493503046'
  };

  const results: { [key: string]: { form: JotFormSchema; questions: JotFormQuestions } } = {};
  const errors: { [key: string]: string } = {};

  console.log('🔄 Starting to fetch JotForm schemas for all document types...');
  console.log('📋 Form IDs to fetch:', formIds);

  // First, test API connectivity
  let apiAccessible = false;
  try {
    const testResponse = await fetch(`${JOTFORM_API_BASE}/user?apikey=${JOTFORM_API_KEY}`, {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    apiAccessible = testResponse.ok;
    console.log(apiAccessible ? '✅ JotForm API is accessible' : '❌ JotForm API test failed');
  } catch (error) {
    console.warn('⚠️  JotForm API connectivity test failed, will use fallback schemas:', error instanceof Error ? error.message : 'Unknown error');
  }

  if (!apiAccessible) {
    console.log('🔄 Using fallback schemas due to API connectivity issues...');
    
    // Use fallback schemas
    for (const [docType, schema] of Object.entries(fallbackSchemas)) {
      if (formIds[docType as keyof typeof formIds]) {
        results[docType] = schema as { form: JotFormSchema; questions: JotFormQuestions };
        console.log(`📋 Loaded fallback schema for ${docType} with ${Object.keys(schema.questions).length} fields`);
      }
    }

    // Add metadata indicating fallback was used
    (results as any)._metadata = {
      successCount: Object.keys(results).length,
      totalCount: Object.keys(formIds).length,
      errors: {},
      timestamp: new Date().toISOString(),
      availableDocumentTypes: Object.keys(results),
      fallbackUsed: true,
      reason: 'JotForm API not accessible'
    };

    console.log(`✅ Successfully loaded ${Object.keys(results).length} fallback schemas`);
    return results;
  }

  // If API is accessible, try to fetch real schemas
  for (const [docType, formId] of Object.entries(formIds)) {
    try {
      console.log(`🔄 Fetching schema for ${docType} (Form ID: ${formId})`);
      const startTime = Date.now();
      
      results[docType] = await fetchJotFormData(formId);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Successfully fetched ${docType} schema in ${duration}ms`);
      console.log(`📊 ${docType} schema contains ${Object.keys(results[docType].questions).length} fields`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to fetch ${docType} schema (Form ID: ${formId}):`, errorMessage);
      
      // Store detailed error information
      errors[docType] = errorMessage;
      
      // Log additional context for debugging
      if (error instanceof Error) {
        console.error(`   📝 Error details for ${docType}:`, {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
          formId
        });
      }
      
      // Use fallback for this specific form
      if (fallbackSchemas[docType as keyof typeof fallbackSchemas]) {
        console.log(`🔄 Using fallback schema for ${docType} due to API error`);
        results[docType] = fallbackSchemas[docType as keyof typeof fallbackSchemas] as { form: JotFormSchema; questions: JotFormQuestions };
      }
    }
  }

  const successCount = Object.keys(results).length;
  const totalCount = Object.keys(formIds).length;
  
  console.log(`📈 Fetch summary: ${successCount}/${totalCount} schemas retrieved successfully`);
  
  if (Object.keys(errors).length > 0) {
    console.warn('⚠️  Some schemas failed to load:', errors);
  }
  
  // Add metadata to results for debugging
  (results as any)._metadata = {
    successCount,
    totalCount,
    errors,
    timestamp: new Date().toISOString(),
    availableDocumentTypes: Object.keys(results),
    fallbackUsed: Object.keys(errors).length > 0,
    apiAccessible
  };

  return results;
}

/**
 * Convert JotForm field to our internal field definition
 */
export function convertJotFormField(field: JotFormField) {
  return {
    id: field.qid,
    name: field.name || field.text?.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
    label: field.text,
    type: mapJotFormFieldType(field.type),
    required: field.required === 'Yes',
    readonly: field.readonly === 'Yes',
    hint: field.hint,
    validation: field.validation,
    options: parseFieldOptions(field.options),
    order: parseInt(field.order || '0')
  };
}

/**
 * Map JotForm field types to our internal types
 */
function mapJotFormFieldType(jotformType: string): string {
  const typeMap: { [key: string]: string } = {
    'control_textbox': 'text',
    'control_textarea': 'textarea', 
    'control_dropdown': 'select',
    'control_radio': 'radio',
    'control_checkbox': 'checkbox',
    'control_email': 'email',
    'control_phone': 'tel',
    'control_datetime': 'date',
    'control_number': 'number',
    'control_signature': 'signature',
    'control_fileupload': 'file',
    'control_button': 'button',
    'control_head': 'heading',
    'control_text': 'static'
  };

  return typeMap[jotformType] || 'text';
}

/**
 * Parse field options for dropdowns, radio buttons, etc.
 */
function parseFieldOptions(optionsString?: string): string[] {
  if (!optionsString) return [];
  
  try {
    // JotForm options are typically pipe-separated
    return optionsString.split('|').filter(option => option.trim());
  } catch {
    return [];
  }
}

/**
 * Test function to verify API connectivity
 */
export async function testJotFormAPI() {
  try {
    const response = await fetch(`${JOTFORM_API_BASE}/user?apikey=${JOTFORM_API_KEY}`);
    if (!response.ok) {
      throw new Error(`API test failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('✅ JotForm API connection successful:', data.content?.username);
    return true;
  } catch (error) {
    console.error('❌ JotForm API connection failed:', error);
    return false;
  }
}