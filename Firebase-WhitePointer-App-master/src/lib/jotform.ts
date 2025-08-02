import { DOCUMENT_TYPES, DocumentType } from './database-schema';
import { buildJotFormURLWithFieldIds } from './jotform-field-inspector';

/**
 * JotForm integration utilities
 */

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const JOTFORM_BASE_URL = 'https://api.jotform.com';

if (!JOTFORM_API_KEY) {
  console.warn('JOTFORM_API_KEY environment variable is not set');
}

/**
 * Build a prefilled JotForm URL with case data
 * This function now uses the improved field ID mapping system
 */
export function buildJotFormURL(
  documentType: DocumentType,
  caseData: any,
  signatureToken: string
): string {
  console.log(`🚀 Building JotForm URL for ${documentType} with improved field ID mapping`);
  console.log('📊 Case data received:', JSON.stringify(caseData, null, 2));

  try {
    // Use the improved field ID mapping system
    const urlWithFieldIds = buildJotFormURLWithFieldIds(documentType, caseData, signatureToken);
    console.log(`✅ Successfully generated JotForm URL with field IDs: ${urlWithFieldIds}`);
    return urlWithFieldIds;
  } catch (error) {
    // For unknown document types, don't fall back - let the error propagate
    if (error instanceof Error && error.message.includes('Unknown document type')) {
      throw error;
    }
    
    // Fallback to legacy method for other errors
    console.log('🔄 Falling back to legacy URL building method...');
    return buildLegacyJotFormURL(documentType, caseData, signatureToken);
  }
}

/**
 * Legacy JotForm URL building method (fallback)
 * Kept for backward compatibility
 */
function buildLegacyJotFormURL(
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

  // Add signature token for tracking
  params.append('signature_token', signatureToken);

  console.log(`🔄 Building legacy JotForm URL for ${documentType} with data:`, caseData);

  // First, add any form field data (question IDs from the form)
  if (caseData && typeof caseData === 'object') {
    Object.entries(caseData).forEach(([key, value]) => {
      // If the key is a number (JotForm question ID), add it as a parameter
      if (/^\d+$/.test(key) && value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
        console.log(`Added question ID param: ${key} = ${value}`);
      }
    });
  }

  // Then map standard case data fields
  // Map case data to JotForm fields based on document type
  switch (documentType) {
    case 'claims':
      mapClaimsFormFields(params, caseData);
      break;
    case 'not-at-fault-rental':
      mapNotAtFaultRentalFields(params, caseData);
      break;
    case 'certis-rental':
      mapCertisRentalFields(params, caseData);
      break;
    case 'authority-to-act':
      mapAuthorityToActFields(params, caseData);
      break;
    case 'direction-to-pay':
      mapDirectionToPayFields(params, caseData);
      break;
    default:
      throw new Error(`Unsupported document type: ${documentType}`);
  }

  const finalUrl = `${baseUrl}?${params.toString()}`;
  console.log(`Generated legacy JotForm URL: ${finalUrl}`);
  return finalUrl;
}

/**
 * Map case data to Claims form fields
 */
function mapClaimsFormFields(params: URLSearchParams, caseData: any): void {
  console.log('Mapping claims form fields:', caseData);
  
  // Helper function to safely add parameters
  const addParam = (key: string, value: any, paramName?: string) => {
    if (value !== undefined && value !== null && value !== '') {
      const actualParamName = paramName || key;
      params.append(actualParamName, String(value));
      console.log(`Added claims param: ${actualParamName} = ${value}`);
    }
  };

  // Client information
  addParam('clientName', caseData.clientName, 'client_name');
  addParam('clientEmail', caseData.clientEmail, 'client_email');
  addParam('clientPhone', caseData.clientPhone, 'client_phone');
  addParam('clientStreetAddress', caseData.clientStreetAddress, 'client_address');
  addParam('clientSuburb', caseData.clientSuburb, 'client_suburb');
  addParam('clientState', caseData.clientState, 'client_state');
  addParam('clientPostcode', caseData.clientPostcode, 'client_postcode');
  
  // At-fault party information
  addParam('atFaultPartyName', caseData.atFaultPartyName, 'af_party_name');
  addParam('atFaultPartyEmail', caseData.atFaultPartyEmail, 'af_party_email');
  addParam('atFaultPartyPhone', caseData.atFaultPartyPhone, 'af_party_phone');
  
  // Case details
  addParam('caseNumber', caseData.caseNumber, 'case_number');
  addParam('accidentDate', caseData.accidentDate, 'accident_date');
  addParam('accidentTime', caseData.accidentTime, 'accident_time');
  addParam('accidentDescription', caseData.accidentDescription, 'accident_description');
  
  // Insurance information
  addParam('clientInsuranceCompany', caseData.clientInsuranceCompany, 'client_insurer');
  addParam('clientClaimNumber', caseData.clientClaimNumber, 'client_claim_number');

  // Additional fields that might be stored in form data
  addParam('naf_name', caseData.naf_name);
  addParam('naf_email', caseData.naf_email);
  addParam('naf_phone', caseData.naf_phone);
  addParam('naf_address', caseData.naf_address);
  addParam('af_name', caseData.af_name);
  addParam('af_phone', caseData.af_phone);
  addParam('accident_location', caseData.accident_location);
}

/**
 * Map case data to Not At Fault Rental form fields
 */
function mapNotAtFaultRentalFields(params: URLSearchParams, caseData: any): void {
  console.log('Mapping not-at-fault rental form fields:', caseData);
  
  // Helper function to safely add parameters
  const addParam = (key: string, value: any, paramName?: string) => {
    if (value !== undefined && value !== null && value !== '') {
      const actualParamName = paramName || key;
      params.append(actualParamName, String(value));
      console.log(`Added rental param: ${actualParamName} = ${value}`);
    }
  };

  // Hirer information mapping
  addParam('clientName', caseData.clientName, 'hirer_name');
  addParam('clientEmail', caseData.clientEmail, 'hirer_email');
  addParam('clientPhone', caseData.clientPhone, 'hirer_phone');
  addParam('clientStreetAddress', caseData.clientStreetAddress, 'hirer_address');
  
  // Rental specific fields
  addParam('caseNumber', caseData.caseNumber, 'rental_case_number');
  addParam('accidentDate', caseData.accidentDate, 'rental_start_date');

  // Additional NAF fields
  addParam('naf_name', caseData.naf_name, 'hirer_name');
  addParam('naf_email', caseData.naf_email, 'hirer_email');
  addParam('naf_phone', caseData.naf_phone, 'hirer_phone');
  addParam('naf_address', caseData.naf_address, 'hirer_address');
  addParam('naf_suburb', caseData.naf_suburb, 'hirer_suburb');
  addParam('naf_state', caseData.naf_state, 'hirer_state');
  addParam('naf_postcode', caseData.naf_postcode, 'hirer_postcode');
  addParam('naf_dob', caseData.naf_dob, 'hirer_dob');
  addParam('naf_licence_no', caseData.naf_licence_no, 'hirer_licence_no');
}

/**
 * Map case data to Certis Rental form fields
 */
function mapCertisRentalFields(params: URLSearchParams, caseData: any): void {
  // Certis specific mapping
  if (caseData.clientName) params.append('certis_hirer_name', caseData.clientName);
  if (caseData.clientEmail) params.append('certis_hirer_email', caseData.clientEmail);
  if (caseData.caseNumber) params.append('certis_case_number', caseData.caseNumber);
}

/**
 * Map case data to Authority to Act form fields
 */
function mapAuthorityToActFields(params: URLSearchParams, caseData: any): void {
  // Authority to act mapping
  if (caseData.clientName) params.append('principal_name', caseData.clientName);
  if (caseData.clientEmail) params.append('principal_email', caseData.clientEmail);
  if (caseData.caseNumber) params.append('authority_case_number', caseData.caseNumber);
  if (caseData.lawyer) params.append('authorized_representative', caseData.lawyer);
}

/**
 * Map case data to Direction to Pay form fields
 */
function mapDirectionToPayFields(params: URLSearchParams, caseData: any): void {
  // Direction to pay mapping
  if (caseData.clientName) params.append('payer_name', caseData.clientName);
  if (caseData.clientEmail) params.append('payer_email', caseData.clientEmail);
  if (caseData.caseNumber) params.append('payment_case_number', caseData.caseNumber);
  if (caseData.agreed) params.append('payment_amount', caseData.agreed.toString());
}

/**
 * Retrieve signed PDF from JotForm
 */
export async function getSignedPDF(
  formId: string,
  submissionId: string
): Promise<{ buffer: Buffer; filename: string }> {
  if (!JOTFORM_API_KEY) {
    throw new Error('JotForm API key is not configured');
  }

  const url = `${JOTFORM_BASE_URL}/pdf-converter/${formId}/fill-pdf?download=1&submissionID=${submissionId}&apikey=${JOTFORM_API_KEY}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`JotForm API error: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `${formId}_${submissionId}.pdf`;

    return { buffer, filename };
  } catch (error) {
    console.error('Error retrieving signed PDF from JotForm:', error);
    throw new Error('Failed to retrieve signed PDF from JotForm');
  }
}

/**
 * Get JotForm submission details
 */
export async function getSubmissionDetails(submissionId: string): Promise<any> {
  if (!JOTFORM_API_KEY) {
    throw new Error('JotForm API key is not configured');
  }

  const url = `${JOTFORM_BASE_URL}/submission/${submissionId}?apikey=${JOTFORM_API_KEY}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`JotForm API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error retrieving submission details from JotForm:', error);
    throw new Error('Failed to retrieve submission details from JotForm');
  }
}

/**
 * Validate JotForm webhook payload
 */
export function validateJotFormWebhook(payload: any): {
  isValid: boolean;
  submissionId?: string;
  formId?: string;
  error?: string;
} {
  try {
    // Parse the raw request if it's a string
    let data = payload;
    if (typeof payload === 'string') {
      data = JSON.parse(payload);
    }

    // Check for required fields
    if (!data.submission_id && !data.submissionID) {
      return { isValid: false, error: 'Missing submission ID' };
    }

    if (!data.form_id && !data.formID) {
      return { isValid: false, error: 'Missing form ID' };
    }

    const submissionId = data.submission_id || data.submissionID;
    const formId = data.form_id || data.formID;

    return {
      isValid: true,
      submissionId: submissionId.toString(),
      formId: formId.toString()
    };
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON payload' };
  }
}

/**
 * Get document type from JotForm form ID
 */
export function getDocumentTypeFromFormId(formId: string): DocumentType | null {
  for (const [docType, config] of Object.entries(DOCUMENT_TYPES)) {
    if (config.jotform_id === formId) {
      return docType as DocumentType;
    }
  }
  return null;
}
