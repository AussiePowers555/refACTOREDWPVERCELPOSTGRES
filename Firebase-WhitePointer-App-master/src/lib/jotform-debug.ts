/**
 * Debug utilities for JotForm integration
 */

import { buildJotFormURL } from './jotform';
import { DocumentType } from './database-schema';

/**
 * Test the JotForm URL generation with sample data
 */
export function testJotFormURLGeneration(documentType: DocumentType, sampleData: any): void {
  console.log('=== JotForm URL Generation Test ===');
  console.log('Document Type:', documentType);
  console.log('Sample Data:', JSON.stringify(sampleData, null, 2));
  
  const testToken = 'test-token-' + Date.now();
  const generatedURL = buildJotFormURL(documentType, sampleData, testToken);
  
  console.log('Generated URL:', generatedURL);
  
  // Parse URL to show parameters
  const url = new URL(generatedURL);
  console.log('URL Parameters:');
  for (const [key, value] of url.searchParams.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  
  console.log('=== End Test ===\n');
}

/**
 * Create sample case data for different document types
 */
export function getSampleCaseData(documentType: DocumentType): any {
  const baseData = {
    caseNumber: 'WW2412001',
    clientName: 'John Smith',
    clientEmail: 'john.smith@example.com',
    clientPhone: '0412345678',
    clientStreetAddress: '123 Test Street',
    clientSuburb: 'Test Suburb',
    clientState: 'NSW', 
    clientPostcode: '2000',
    naf_name: 'John Smith',
    naf_email: 'john.smith@example.com',
    naf_phone: '0412345678',
    naf_address: '123 Test Street',
    naf_suburb: 'Test Suburb',
    naf_state: 'NSW',
    naf_postcode: '2000',
    naf_dob: '1990-01-15',
    naf_licence_no: 'NSW123456789'
  };

  switch (documentType) {
    case 'claims':
      return {
        ...baseData,
        atFaultPartyName: 'Jane Doe',
        atFaultPartyEmail: 'jane.doe@example.com',
        atFaultPartyPhone: '0487654321',
        af_name: 'Jane Doe',
        af_phone: '0487654321',
        accidentDate: '2024-07-28',
        accidentTime: '14:30',
        accidentLocation: 'Main Street & First Avenue',
        accidentDescription: 'Rear-end collision at traffic lights',
        clientInsuranceCompany: 'NRMA Insurance',
        clientClaimNumber: 'CLM123456789'
      };
      
    case 'not-at-fault-rental':
      return {
        ...baseData,
        accidentDate: '2024-07-28',
        rentalStartDate: '2024-07-29',
        rentalEndDate: '2024-08-05'
      };
      
    case 'certis-rental':
      return {
        ...baseData,
        certisReferenceNumber: 'CRT789012'
      };
      
    case 'authority-to-act':
      return {
        ...baseData,
        lawyer: 'Smith & Associates Legal',
        authorizedRepresentative: 'Michael Johnson'
      };
      
    case 'direction-to-pay':
      return {
        ...baseData,
        agreed: 5000,
        paymentAmount: '5000.00',
        paymentDescription: 'Settlement for vehicle damages'
      };
      
    default:
      return baseData;
  }
}

/**
 * Test all document types with sample data
 */
export function testAllDocumentTypes(): void {
  const documentTypes: DocumentType[] = [
    'claims',
    'not-at-fault-rental', 
    'certis-rental',
    'authority-to-act',
    'direction-to-pay'
  ];

  console.log('🧪 Testing JotForm URL generation for all document types...\n');
  
  documentTypes.forEach(docType => {
    const sampleData = getSampleCaseData(docType);
    testJotFormURLGeneration(docType, sampleData);
  });
}

/**
 * Validate that URL contains expected parameters
 */
export function validateJotFormURL(url: string, expectedParams: string[]): boolean {
  const urlObj = new URL(url);
  const missingParams: string[] = [];
  
  expectedParams.forEach(param => {
    if (!urlObj.searchParams.has(param)) {
      missingParams.push(param);
    }
  });
  
  if (missingParams.length > 0) {
    console.error('❌ Missing expected parameters:', missingParams);
    return false;
  }
  
  console.log('✅ All expected parameters found in URL');
  return true;
}

/**
 * Extract signature token from JotForm URL
 */
export function extractSignatureToken(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('signature_token');
  } catch {
    return null;
  }
}

/**
 * Compare two JotForm URLs to see if they have the same parameters (excluding token)
 */
export function compareJotFormURLs(url1: string, url2: string): {
  same: boolean;
  differences: string[];
} {
  const urlObj1 = new URL(url1);
  const urlObj2 = new URL(url2);
  
  const params1 = new Map(urlObj1.searchParams.entries());
  const params2 = new Map(urlObj2.searchParams.entries());
  
  // Remove signature tokens for comparison
  params1.delete('signature_token');
  params2.delete('signature_token');
  
  const differences: string[] = [];
  
  // Check params in url1 that are different or missing in url2
  for (const [key, value1] of params1) {
    const value2 = params2.get(key);
    if (value2 === undefined) {
      differences.push(`Missing in URL2: ${key}=${value1}`);
    } else if (value1 !== value2) {
      differences.push(`Different values for ${key}: "${value1}" vs "${value2}"`);
    }
  }
  
  // Check params in url2 that are missing in url1
  for (const [key, value2] of params2) {
    if (!params1.has(key)) {
      differences.push(`Missing in URL1: ${key}=${value2}`);
    }
  }
  
  return {
    same: differences.length === 0,
    differences
  };
}