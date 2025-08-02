import { NextRequest, NextResponse } from 'next/server';
import { getSignatureToken, updateSignatureTokenStatus } from '@/lib/signature-tokens';

// Mapping from JotForm field IDs to CustomClaimsForm field names
// Based on actual JotForm field inspection for Claims Form (232543267390861)
const JOTFORM_TO_CUSTOM_MAPPING: Record<string, string> = {
  // Panel Shop fields
  '3': 'panelShopContact',        // q3_contact[first] - Panel Shop Contact First Name
  '19': 'panelShopName',          // q19_typeA19 - Panel Shop Name
  '26': 'panelShopPhone',         // q26_phoneNumber[phone] - Panel Shop Phone
  '79': 'repairStartDate',        // q79_repairStart - Repair Start Date

  // Client/Driver fields
  '41': 'clientName',             // q41_driver[first] - Driver First Name
  '4': 'clientEmail',             // q4_email - Email Address
  '15': 'clientPhone',            // q15_mobileNo - Mobile Number

  // Insurance fields
  '51': 'insuranceCompany',       // q51_insuranceCompany - Insurance Company
  '59': 'claimNumber',            // q59_claimNumber59 - Claim Number

  // At-fault party fields
  '66': 'afOwnerPhone',           // At-fault party phone

  // Accident details
  '75': 'accidentDetails',        // q75_accidentDetails - Accident Details
  '76': 'accidentLocation',       // q76_accidentLocation - Accident Location

  // Checkboxes/booleans
  '54': 'vehicleCondition',       // Vehicle condition checkbox
  '78': 'injuries'                // Injuries checkbox
};

// Convert JotForm data format to CustomClaimsForm format
function convertJotFormDataToCustomFormat(jotFormData: any): any {
  const customData: any = {};

  // Handle direct field mappings from JotForm field IDs
  Object.entries(jotFormData).forEach(([key, value]) => {
    const customFieldName = JOTFORM_TO_CUSTOM_MAPPING[key];
    if (customFieldName && value !== null && value !== undefined && value !== '') {
      // Special handling for vehicle condition (checkbox array)
      if (customFieldName === 'vehicleCondition' && typeof value === 'boolean' && value) {
        customData[customFieldName] = ['DRIVEABLE']; // Default assumption
      }
      // Special handling for injuries boolean
      else if (customFieldName === 'injuries') {
        customData[customFieldName] = Boolean(value);
      }
      // Regular field mapping
      else {
        customData[customFieldName] = value;
      }
    }
  });

  // Include case data that's stored with semantic keys (non-numeric)
  Object.entries(jotFormData).forEach(([key, value]) => {
    if (isNaN(Number(key)) && value !== null && value !== undefined && value !== '') {
      // Map common case data fields to expected custom form fields
      switch (key) {
        case 'clientName':
          customData.clientName = value;
          break;
        case 'clientEmail':
          customData.clientEmail = value;
          break;
        case 'clientPhone':
          customData.clientPhone = value;
          break;
        case 'caseNumber':
          customData.caseNumber = value;
          break;
        case 'atFaultPartyName':
          customData.afDriverName = value;
          break;
        case 'atFaultPartyPhone':
          customData.afDriverPhone = value;
          break;
        case 'atFaultPartyEmail':
          customData.afDriverEmail = value;
          break;
        case 'clientInsuranceCompany':
          customData.insuranceCompany = value;
          break;
        case 'atFaultPartyInsuranceCompany':
          customData.afInsuranceCompany = value;
          break;
        default:
          // Include other non-numeric keys as-is
          customData[key] = value;
      }
    }
  });

  console.log('🔄 Converted JotForm data to custom format:', {
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
    
    console.log('🔍 Attempting to retrieve token data:', { token });
    
    // Get signature token data - add error handling for database connection issues
    let tokenData;
    try {
      tokenData = await getSignatureToken(token);
    } catch (dbError: any) {
      console.error('💥 Database error retrieving signature token:', dbError);
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
    
    // Check if token is expired
    if (tokenData.expiresAt && new Date() > tokenData.expiresAt.toDate()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 410 }
      );
    }
    
    // Convert JotForm format to CustomClaimsForm format
    const rawFormData = tokenData.formData || tokenData.form_data || {};
    console.log('🔍 Raw form data before conversion:', rawFormData);
    const convertedFormData = convertJotFormDataToCustomFormat(rawFormData);

    // Return form data for prefilling
    return NextResponse.json({
      success: true,
      formData: convertedFormData,
      caseId: tokenData.caseId,
      documentType: tokenData.documentType,
      status: tokenData.status
    });
    
  } catch (error: any) {
    console.error('💥 Error loading form data:', error);
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
