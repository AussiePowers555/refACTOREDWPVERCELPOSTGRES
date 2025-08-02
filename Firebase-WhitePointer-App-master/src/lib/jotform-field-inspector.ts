/**
 * JotForm Field Inspector and Mapping Utilities
 * Helps identify correct field IDs and unique names for prefilling
 */

import { DOCUMENT_TYPES, DocumentType } from './database-schema';

/**
 * Known field mappings for different JotForm forms
 * These should be updated based on actual form inspection
 */
export const JOTFORM_FIELD_MAPPINGS = {
  // Claims Form (232543267390861) - ACTUAL FIELD NAMES FROM FORM INSPECTION
  'claims': {
    // Panel Shop section
    panelShopName: 'q19_typeA19', // Panel Shop Name
    panelShopContactFirst: 'q3_contact[first]', // Contact* First Name
    panelShopContactLast: 'q3_contact[last]', // Contact* Last Name
    panelShopPhone: 'q26_phoneNumber[phone]', // Phone Number
    panelShopPhoneArea: 'q26_phoneNumber[area]', // Phone Area Code
    repairStartDate: 'q79_repairStart', // Repair Start Date

    // Client/Driver section
    clientNameFirst: 'q41_driver[first]', // Driver* First Name
    clientNameLast: 'q41_driver[last]', // Driver* Last Name
    clientPhone: 'q15_mobileNo', // Mobile No.*
    clientAddress: 'q32_address[addr_line1]', // Address Street
    clientAddressLine2: 'q32_address[addr_line2]', // Address Line 2
    clientCity: 'q32_address[city]', // City
    clientState: 'q32_address[state]', // State
    clientPostcode: 'q32_address[postal]', // Postal Code
    clientEmail: 'q4_email', // Email*

    // Owner section (if different from driver)
    ownerNameFirst: 'q42_owner[first]', // Owner First Name
    ownerNameLast: 'q42_owner[last]', // Owner Last Name
    ownerPhone: 'q46_mobileNo46', // Owner Mobile No.
    ownerEmail: 'q48_email48', // Owner Email

    // Client Insurance section
    insuranceCompany: 'q51_insuranceCompany', // Insurance Company
    claimNumber: 'q59_claimNumber59', // Claim Number

    // Client Vehicle details
    make: 'q52_Make', // Make
    model: 'q56_claimNumber56', // Model (note: field name mismatch in form)
    year: 'q57_claimNumber57', // Year (note: field name mismatch in form)
    rego: 'q58_claimNumber58', // Rego No. (note: field name mismatch in form)

    // At-fault driver section
    afDriverNameFirst: 'q61_driver61[first]', // AF Driver First Name
    afDriverNameLast: 'q61_driver61[last]', // AF Driver Last Name
    afDriverPhone: 'q62_mobileNo62', // AF Driver Mobile
    afDriverAddress: 'q63_address63[addr_line1]', // AF Driver Address
    afDriverEmail: 'q65_email65', // AF Driver Email

    // At-fault owner section (if different)
    afOwnerNameFirst: 'q64_owner64[first]', // AF Owner First Name
    afOwnerNameLast: 'q64_owner64[last]', // AF Owner Last Name
    afOwnerPhone: 'q66_mobileNo66', // AF Owner Mobile*
    afOwnerEmail: 'q67_email67', // AF Owner Email
    afOwnerAddress: 'q68_address68[addr_line1]', // AF Owner Address

    // At-fault insurance section
    afInsuranceCompany: 'q69_insuranceCompany69', // AF Insurance Company
    afClaimNumber: 'q70_claimNumber', // AF Claim Number

    // At-fault vehicle details
    afMake: 'q71_Make71', // AF Make
    afModel: 'q72_model', // AF Model
    afYear: 'q73_year', // AF Year
    afRego: 'q74_regoNo', // AF Rego No.

    // Accident details
    accidentDetails: 'q75_accidentDetails', // Accident Details*
    accidentLocation: 'q76_accidentLocation', // Accident Location*
    accidentDiagram: 'q77_typeA77', // Diagram/Drawing

    // Injuries checkbox (Yes/No)
    injuriesYes: 'q78_injuriesHas[]', // INJURIES Yes checkbox
    injuriesNo: 'q78_injuriesHas[]', // INJURIES No checkbox

    // Vehicle condition checkboxes
    vehicleDriveable: 'q54_isThe[]', // DRIVEABLE checkbox
    vehicleNonDriveable: 'q54_isThe[]', // NON DRIVEABLE checkbox
    vehicleTotalLoss: 'q54_isThe[]', // TOTAL LOSS checkbox

    // Signature
    signature: 'q14_typeA' // Signature field
  },
  
  // Not At Fault Rental (233241680987464)
  'not-at-fault-rental': {
    hirerName: '3',
    hirerEmail: '4', 
    hirerPhone: '5',
    hirerAddress: '6',
    rentalCaseNumber: '7',
    rentalStartDate: '8'
  },
  
  // Certis Rental (233238940095055)
  'certis-rental': {
    certisHirerName: '3',
    certisHirerEmail: '4',
    certisCaseNumber: '5'
  },
  
  // Authority to Act (233183619631457)
  'authority-to-act': {
    principalName: '3',
    principalEmail: '4',
    authorityCaseNumber: '5',
    authorizedRepresentative: '6'
  },
  
  // Direction to Pay (233061493503046)
  'direction-to-pay': {
    payerName: '3',
    payerEmail: '4',
    paymentCaseNumber: '5',
    paymentAmount: '6'
  }
} as const;

/**
 * Alternative field name patterns to try if field IDs don't work
 */
export const ALTERNATIVE_FIELD_PATTERNS = {
  'claims': {
    // Try unique names if field IDs fail
    panelShopName: ['panelShop', 'panel_shop', 'shopName'],
    clientName: ['driver', 'driverName', 'client_name', 'name'],
    clientEmail: ['email', 'client_email', 'driver_email'],
    clientPhone: ['mobileNo', 'mobile_no', 'phone', 'client_phone'],
    insuranceCompany: ['insurance', 'insurer', 'insurance_company'],
    claimNumber: ['claim', 'claim_number', 'claimNo'],
    accidentDetails: ['accident_details', 'accident', 'details'],
    accidentLocation: ['accident_location', 'location']
  }
};

/**
 * Build JotForm URL with proper field ID mapping
 */
export function buildJotFormURLWithFieldIds(
  documentType: DocumentType,
  caseData: any,
  signatureToken: string
): string {
  const formConfig = DOCUMENT_TYPES[documentType];
  if (!formConfig) {
    throw new Error(`Unknown document type: ${documentType}`);
  }

  const baseUrl = `https://form.jotform.com/${formConfig.jotform_id}`;
  const params = new URLSearchParams();

  // Add signature token
  params.append('signature_token', signatureToken);

  console.log(`🔍 Building JotForm URL for ${documentType} with field IDs`);
  console.log('📊 Case data:', caseData);

  // Get field mapping for this document type
  const fieldMapping = JOTFORM_FIELD_MAPPINGS[documentType as keyof typeof JOTFORM_FIELD_MAPPINGS];
  if (!fieldMapping) {
    console.warn(`⚠️  No field mapping found for document type: ${documentType}`);
    return `${baseUrl}?${params.toString()}`;
  }

  // Map case data to JotForm field IDs
  switch (documentType) {
    case 'claims':
      mapClaimsFormWithFieldIds(params, caseData, fieldMapping);
      break;
    case 'not-at-fault-rental':
      mapNotAtFaultRentalWithFieldIds(params, caseData, fieldMapping);
      break;
    case 'certis-rental':
      mapCertisRentalWithFieldIds(params, caseData, fieldMapping);
      break;
    case 'authority-to-act':
      mapAuthorityToActWithFieldIds(params, caseData, fieldMapping);
      break;
    case 'direction-to-pay':
      mapDirectionToPayWithFieldIds(params, caseData, fieldMapping);
      break;
  }

  const finalUrl = `${baseUrl}?${params.toString()}`;
  console.log(`✅ Generated JotForm URL with field IDs: ${finalUrl}`);
  return finalUrl;
}

/**
 * Map claims form data using field IDs
 */
function mapClaimsFormWithFieldIds(params: URLSearchParams, caseData: any, fieldMapping: any): void {
  console.log('🗺️  Mapping claims form with field IDs...');

  const addFieldParam = (fieldKey: string, value: any, fallbackNames?: string[]) => {
    if (value !== undefined && value !== null && value !== '') {
      const fieldId = fieldMapping[fieldKey];
      if (fieldId) {
        params.append(fieldId, String(value));
        console.log(`✅ Mapped ${fieldKey} (${fieldId}) = ${value}`);
        return true;
      } else {
        console.warn(`⚠️  No field ID found for ${fieldKey}`);
        
        // Try fallback names
        if (fallbackNames) {
          fallbackNames.forEach(name => {
            params.append(name, String(value));
            console.log(`🔄 Fallback: ${name} = ${value}`);
          });
        }
        return false;
      }
    }
    return false;
  };

  // Panel Shop information
  addFieldParam('panelShopName', caseData.panelShopName || caseData.repairShop, ['panelShop', 'panel_shop']);
  addFieldParam('panelShopContactFirst', caseData.panelShopContact || caseData.repairContact, ['contact']);
  addFieldParam('panelShopPhone', caseData.panelShopPhone || caseData.repairPhone, ['phone']);

  // Client/Driver information - split name into first/last for JotForm
  const clientName = caseData.clientName || caseData.naf_name || '';
  const nameParts = clientName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  addFieldParam('clientNameFirst', firstName, ['driver', 'name']);
  addFieldParam('clientNameLast', lastName, ['driver_last']);
  addFieldParam('clientPhone', caseData.clientPhone || caseData.naf_phone, ['mobileNo', 'mobile']);
  addFieldParam('clientEmail', caseData.clientEmail || caseData.naf_email, ['email']);
  addFieldParam('clientAddress', caseData.clientStreetAddress || caseData.clientAddress || caseData.naf_address, ['address']);
  addFieldParam('clientCity', caseData.clientSuburb || caseData.clientCity, ['city']);
  addFieldParam('clientState', caseData.clientState, ['state']);
  addFieldParam('clientPostcode', caseData.clientPostcode, ['postcode']);

  // Insurance information
  addFieldParam('insuranceCompany', caseData.clientInsuranceCompany || caseData.insuranceCompany || caseData.naf_insurer, ['insurance']);
  addFieldParam('claimNumber', caseData.clientClaimNumber || caseData.claimNumber || caseData.naf_claim, ['claim']);

  // Vehicle information
  addFieldParam('make', caseData.make || caseData.naf_make, ['make']);
  addFieldParam('model', caseData.model || caseData.naf_model, ['model']);
  addFieldParam('year', caseData.year || caseData.naf_year, ['year']);
  addFieldParam('rego', caseData.rego || caseData.naf_rego || caseData.clientVehicleRego, ['rego']);

  // At-fault party information - split name into first/last
  const afName = caseData.atFaultPartyName || caseData.af_name || '';
  const afNameParts = afName.split(' ');
  const afFirstName = afNameParts[0] || '';
  const afLastName = afNameParts.slice(1).join(' ') || '';

  addFieldParam('afDriverNameFirst', afFirstName, ['af_driver']);
  addFieldParam('afDriverNameLast', afLastName, ['af_driver_last']);
  addFieldParam('afDriverPhone', caseData.atFaultPartyPhone || caseData.af_phone, ['af_mobile']);
  addFieldParam('afDriverEmail', caseData.atFaultPartyEmail || caseData.af_email, ['af_email']);
  addFieldParam('afInsuranceCompany', caseData.atFaultPartyInsuranceCompany || caseData.af_insurer, ['af_insurance']);
  addFieldParam('afClaimNumber', caseData.atFaultPartyClaimNumber || caseData.af_claim, ['af_claim']);
  addFieldParam('afRego', caseData.atFaultPartyVehicleRego || caseData.af_rego, ['af_rego']);

  // Accident details
  addFieldParam('accidentDetails', caseData.accidentDescription || caseData.accident_description, ['accident']);
  addFieldParam('accidentLocation', caseData.accidentLocation || caseData.accident_location, ['location']);

  // Case reference - add as fallback parameter
  if (caseData.caseNumber) {
    params.append('case_number', caseData.caseNumber);
    console.log(`✅ Added case_number = ${caseData.caseNumber}`);
  }
}

/**
 * Map other form types with field IDs
 */
function mapNotAtFaultRentalWithFieldIds(params: URLSearchParams, caseData: any, fieldMapping: any): void {
  console.log('🗺️  Mapping not-at-fault rental with field IDs...');
  
  const addParam = (key: string, value: any) => {
    const fieldId = fieldMapping[key];
    if (fieldId && value) {
      params.append(fieldId, String(value));
      console.log(`✅ Mapped ${key} (${fieldId}) = ${value}`);
    }
  };

  addParam('hirerName', caseData.clientName || caseData.naf_name);
  addParam('hirerEmail', caseData.clientEmail || caseData.naf_email);
  addParam('hirerPhone', caseData.clientPhone || caseData.naf_phone);
  addParam('hirerAddress', caseData.clientAddress || caseData.naf_address);
  addParam('rentalCaseNumber', caseData.caseNumber);
  addParam('rentalStartDate', caseData.accidentDate);
}

function mapCertisRentalWithFieldIds(params: URLSearchParams, caseData: any, fieldMapping: any): void {
  console.log('🗺️  Mapping Certis rental with field IDs...');
  
  const addParam = (key: string, value: any) => {
    const fieldId = fieldMapping[key];
    if (fieldId && value) {
      params.append(fieldId, String(value));
      console.log(`✅ Mapped ${key} (${fieldId}) = ${value}`);
    }
  };

  addParam('certisHirerName', caseData.clientName || caseData.naf_name);
  addParam('certisHirerEmail', caseData.clientEmail || caseData.naf_email);
  addParam('certisCaseNumber', caseData.caseNumber);
}

function mapAuthorityToActWithFieldIds(params: URLSearchParams, caseData: any, fieldMapping: any): void {
  console.log('🗺️  Mapping authority to act with field IDs...');
  
  const addParam = (key: string, value: any) => {
    const fieldId = fieldMapping[key];
    if (fieldId && value) {
      params.append(fieldId, String(value));
      console.log(`✅ Mapped ${key} (${fieldId}) = ${value}`);
    }
  };

  addParam('principalName', caseData.clientName || caseData.naf_name);
  addParam('principalEmail', caseData.clientEmail || caseData.naf_email);
  addParam('authorityCaseNumber', caseData.caseNumber);
  addParam('authorizedRepresentative', caseData.lawyer);
}

function mapDirectionToPayWithFieldIds(params: URLSearchParams, caseData: any, fieldMapping: any): void {
  console.log('🗺️  Mapping direction to pay with field IDs...');
  
  const addParam = (key: string, value: any) => {
    const fieldId = fieldMapping[key];
    if (fieldId && value) {
      params.append(fieldId, String(value));
      console.log(`✅ Mapped ${key} (${fieldId}) = ${value}`);
    }
  };

  addParam('payerName', caseData.clientName || caseData.naf_name);
  addParam('payerEmail', caseData.clientEmail || caseData.naf_email);
  addParam('paymentCaseNumber', caseData.caseNumber);
  addParam('paymentAmount', caseData.agreed || caseData.settlement_amount);
}

/**
 * Validate JotForm URL by testing field parameter format
 */
export function validateJotFormURL(url: string): {
  isValid: boolean;
  fieldCount: number;
  hasFieldIds: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let fieldCount = 0;
  let hasFieldIds = false;

  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // Check if it's a JotForm URL
    if (!url.includes('jotform.com')) {
      issues.push('Not a JotForm URL');
    }

    // Count parameters
    fieldCount = params.size;

    // Check for numeric field IDs (proper JotForm prefill format)
    for (const [key, value] of params.entries()) {
      if (/^\d+$/.test(key)) {
        hasFieldIds = true;
      }
      if (!value || value.trim() === '') {
        issues.push(`Empty value for parameter: ${key}`);
      }
    }

    if (fieldCount === 0) {
      issues.push('No URL parameters found');
    }

    if (!hasFieldIds && fieldCount > 1) {
      issues.push('No numeric field IDs found - may not prefill correctly');
    }

  } catch (error) {
    issues.push(`Invalid URL format: ${(error as Error).message}`);
  }

  return {
    isValid: issues.length === 0,
    fieldCount,
    hasFieldIds,
    issues
  };
}

/**
 * Generate test URLs for debugging
 */
export function generateTestUrls(documentType: DocumentType): string[] {
  const testCaseData = {
    caseNumber: '2025-001',
    clientName: 'Greg',
    clientEmail: 'whitepointer2016@gmail.com',
    clientPhone: '0413063463',
    panelShopName: 'Tims',
    panelShopContact: '555 555'
  };

  const urls: string[] = [];
  const token = 'test-token-' + Date.now();

  // Generate URL with field IDs
  try {
    const urlWithFieldIds = buildJotFormURLWithFieldIds(documentType, testCaseData, token);
    urls.push(urlWithFieldIds);
  } catch (error) {
    console.error('Failed to generate URL with field IDs:', error);
  }

  // Generate URL with alternative patterns
  const formConfig = DOCUMENT_TYPES[documentType];
  if (formConfig) {
    const baseUrl = `https://form.jotform.com/${formConfig.jotform_id}`;
    const params = new URLSearchParams();
    
    // Try common field patterns
    params.append('signature_token', token);
    params.append('driver', testCaseData.clientName);
    params.append('email', testCaseData.clientEmail);
    params.append('mobileNo', testCaseData.clientPhone);
    params.append('panelShop', testCaseData.panelShopName);
    
    urls.push(`${baseUrl}?${params.toString()}`);
  }

  return urls;
}