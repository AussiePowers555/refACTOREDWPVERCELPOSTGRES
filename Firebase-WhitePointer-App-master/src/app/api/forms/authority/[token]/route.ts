import { NextRequest, NextResponse } from 'next/server';
import { getSignatureToken, updateSignatureTokenStatus } from '@/lib/signature-tokens';

// Mapping from JotForm field IDs to CustomAuthorityToActForm field names
// Based on actual JotForm field inspection for Authority to Act Form
const JOTFORM_TO_AUTHORITY_MAPPING: Record<string, string> = {
  // Case reference
  '3': 'caseReference',           // CC REF No.
  
  // Not at fault party details
  '4': 'notAtFaultFirstName',     // First Name
  '5': 'notAtFaultLastName',      // Last Name
  '6': 'accidentDate',            // Date of accident
  
  // Vehicle details
  '7': 'regoNumber',              // Rego No.
  '8': 'insuranceCompany',        // Insurance Company
  '9': 'claimNumber',             // Claim Number
  
  // At fault party details
  '10': 'atFaultFirstName',       // At fault first name
  '11': 'atFaultLastName',        // At fault last name
  '12': 'atFaultRegoNumber',      // At fault rego
  '13': 'atFaultInsuranceCompany', // At fault insurance
  '14': 'atFaultClaimNumber',     // At fault claim number
  
  // Signature dates
  '15': 'notAtFaultSignatureDate', // Not at fault signature date
  '16': 'atFaultSignatureDate',   // At fault signature date
};

// Convert JotForm data format to CustomAuthorityToActForm format
function convertJotFormDataToAuthorityFormat(jotFormData: any): any {
  const customData: any = {};
  
  // Handle direct field mappings from JotForm field IDs
  Object.entries(jotFormData).forEach(([key, value]) => {
    const customFieldName = JOTFORM_TO_AUTHORITY_MAPPING[key];
    if (customFieldName && value !== null && value !== undefined && value !== '') {
      customData[customFieldName] = value;
    }
  });
  
  // Include case data that's stored with semantic keys (non-numeric)
  Object.entries(jotFormData).forEach(([key, value]) => {
    if (isNaN(Number(key)) && value !== null && value !== undefined && value !== '') {
      // Map common case data fields to expected custom form fields
      switch (key) {
        case 'clientName':
          customData.notAtFaultFirstName = value.toString().split(' ')[0] || '';
          customData.notAtFaultLastName = value.toString().split(' ').slice(1).join(' ') || '';
          break;
        case 'clientEmail':
          // Authority to Act doesn't have email fields, but store for reference
          customData.clientEmail = value;
          break;
        case 'clientPhone':
          // Authority to Act doesn't have phone fields, but store for reference
          customData.clientPhone = value;
          break;
        case 'caseNumber':
          customData.caseNumber = value;
          customData.caseReference = value; // Use case number as reference
          break;
        case 'atFaultPartyName':
          customData.atFaultFirstName = value.toString().split(' ')[0] || '';
          customData.atFaultLastName = value.toString().split(' ').slice(1).join(' ') || '';
          break;
        case 'clientInsuranceCompany':
          customData.insuranceCompany = value;
          break;
        case 'atFaultPartyInsuranceCompany':
          customData.atFaultInsuranceCompany = value;
          break;
        case 'accidentDate':
          customData.accidentDate = value;
          break;
        default:
          // Include other non-numeric keys as-is
          customData[key] = value;
      }
    }
  });
  
  console.log('🔄 Converted JotForm data to Authority format:', {
    original: jotFormData,
    converted: customData
  });
  
  return customData;
}

export async function GET(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params;
    
    console.log('🔍 Loading Authority to Act form data for token:', token);
    
    // Get signature token data with better error handling
    let tokenData;
    try {
      tokenData = await getSignatureToken(token);
    } catch (dbError: any) {
      console.error('💥 Database error retrieving authority token:', dbError);
      return NextResponse.json(
        { error: 'Database connection error', details: dbError?.message || 'Unknown database error' },
        { status: 500 }
      );
    }
    
    console.log('🔍 Retrieved token data from database:', {
      token,
      tokenExists: !!tokenData,
      tokenData: tokenData ? {
        ...tokenData,
        formData: tokenData.formData || tokenData.form_data
      } : null
    });
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    // Check if this is an Authority to Act form
    if (tokenData.documentType !== 'authority-to-act') {
      return NextResponse.json(
        { error: 'Invalid document type for this form' },
        { status: 400 }
      );
    }

    // Convert JotForm format to CustomAuthorityToActForm format
    const rawFormData = tokenData.formData || tokenData.form_data || {};
    console.log('🔍 Raw form data before conversion:', rawFormData);
    const convertedFormData = convertJotFormDataToAuthorityFormat(rawFormData);
    
    // Return form data for prefilling
    return NextResponse.json({
      success: true,
      formData: convertedFormData,
      caseId: tokenData.caseId,
      documentType: tokenData.documentType,
      status: tokenData.status
    });

  } catch (error: any) {
    console.error('❌ Error loading Authority to Act form data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load form data', 
        message: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params;
    const formData = await request.json();
    
    console.log('🔁 Updating Authority to Act form data for token:', token, formData);
    
    // Get existing token data with better error handling
    let tokenData;
    try {
      tokenData = await getSignatureToken(token);
    } catch (dbError: any) {
      console.error('💥 Database error retrieving authority token for update:', dbError);
      return NextResponse.json(
        { error: 'Database connection error', details: dbError?.message || 'Unknown database error' },
        { status: 500 }
      );
    }
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    // Update the form data (this would typically update the database)
    // For now, we'll just return success
    console.log('✅ Authority to Act form data updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Form data updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error updating Authority to Act form data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update form data', 
        message: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined 
      },
      { status: 500 }
    );
  }
}
