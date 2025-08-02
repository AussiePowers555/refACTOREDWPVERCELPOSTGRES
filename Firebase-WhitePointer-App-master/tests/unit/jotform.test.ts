import { test, expect } from '@playwright/test';
import { 
  buildJotFormURL, 
  validateJotFormWebhook, 
  getDocumentTypeFromFormId 
} from '../../src/lib/jotform';
import { testCases } from '../fixtures/signature-test-data';

test.describe('JotForm Integration', () => {
  test('buildJotFormURL creates correct URL for claims form', () => {
    const url = buildJotFormURL('claims', testCases.validCase, 'test-token-123');
    
    expect(url).toContain('https://form.jotform.com/232543267390861');
    expect(url).toContain('signature_token=test-token-123');
    expect(url).toContain('q41_driver%5Bfirst%5D=John'); // clientNameFirst uses field ID
    expect(url).toContain('q41_driver%5Blast%5D=Doe'); // clientNameLast uses field ID
    expect(url).toContain('q4_email=john.doe%40example.com'); // clientEmail uses field ID
    expect(url).toContain('case_number=TEST001'); // legacy fallback field
  });

  test('buildJotFormURL creates correct URL for not-at-fault rental', () => {
    const url = buildJotFormURL('not-at-fault-rental', testCases.validCase, 'test-token-456');
    
    expect(url).toContain('https://form.jotform.com/233241680987464');
    expect(url).toContain('signature_token=test-token-456');
    expect(url).toContain('3=John+Doe'); // hirerName field ID (+ for spaces)
    expect(url).toContain('4=john.doe%40example.com'); // hirerEmail field ID
  });

  test('buildJotFormURL throws error for unknown document type', () => {
    expect(() => {
      buildJotFormURL('unknown-type' as any, testCases.validCase, 'test-token');
    }).toThrow('Unknown document type: unknown-type');
  });

  test('validateJotFormWebhook validates correct payload', () => {
    const payload = {
      submission_id: '12345',
      form_id: '232543267390861',
      status: 'ACTIVE'
    };

    const result = validateJotFormWebhook(payload);
    
    expect(result.isValid).toBe(true);
    expect(result.submissionId).toBe('12345');
    expect(result.formId).toBe('232543267390861');
    expect(result.error).toBeUndefined();
  });

  test('validateJotFormWebhook validates JSON string payload', () => {
    const payload = JSON.stringify({
      submissionID: '67890',
      formID: '233241680987464',
      status: 'ACTIVE'
    });

    const result = validateJotFormWebhook(payload);
    
    expect(result.isValid).toBe(true);
    expect(result.submissionId).toBe('67890');
    expect(result.formId).toBe('233241680987464');
  });

  test('validateJotFormWebhook rejects payload without submission ID', () => {
    const payload = {
      form_id: '232543267390861',
      status: 'ACTIVE'
    };

    const result = validateJotFormWebhook(payload);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Missing submission ID');
  });

  test('validateJotFormWebhook rejects payload without form ID', () => {
    const payload = {
      submission_id: '12345',
      status: 'ACTIVE'
    };

    const result = validateJotFormWebhook(payload);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Missing form ID');
  });

  test('validateJotFormWebhook rejects invalid JSON', () => {
    const payload = 'invalid json {';

    const result = validateJotFormWebhook(payload);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid JSON payload');
  });

  test('getDocumentTypeFromFormId returns correct document type', () => {
    expect(getDocumentTypeFromFormId('232543267390861')).toBe('claims');
    expect(getDocumentTypeFromFormId('233241680987464')).toBe('not-at-fault-rental');
    expect(getDocumentTypeFromFormId('233238940095055')).toBe('certis-rental');
    expect(getDocumentTypeFromFormId('233183619631457')).toBe('authority-to-act');
    expect(getDocumentTypeFromFormId('233061493503046')).toBe('direction-to-pay');
  });

  test('getDocumentTypeFromFormId returns null for unknown form ID', () => {
    expect(getDocumentTypeFromFormId('999999999999999')).toBeNull();
  });

  test('buildJotFormURL handles special characters in case data', () => {
    const caseDataWithSpecialChars = {
      ...testCases.validCase,
      clientName: 'John O\'Connor & Associates',
      accidentDescription: 'Collision at Main St & 1st Ave'
    };

    const url = buildJotFormURL('claims', caseDataWithSpecialChars, 'test-token');
    
    expect(url).toContain('q41_driver%5Bfirst%5D=John'); // clientNameFirst field ID
    expect(url).toContain('q41_driver%5Blast%5D=O%27Connor+%26+Associates'); // clientNameLast field ID (+ for spaces)
    expect(url).toContain('q75_accidentDetails=Collision+at+Main+St+%26+1st+Ave'); // accidentDetails field ID (+ for spaces)
  });

  test('buildJotFormURL handles missing optional fields gracefully', () => {
    const minimalCaseData = {
      caseNumber: 'TEST001',
      clientName: 'John Doe'
    };

    const url = buildJotFormURL('claims', minimalCaseData, 'test-token');
    
    expect(url).toContain('https://form.jotform.com/232543267390861');
    expect(url).toContain('signature_token=test-token');
    expect(url).toContain('case_number=TEST001');
    expect(url).toContain('q41_driver%5Bfirst%5D=John'); // clientNameFirst field ID
    expect(url).toContain('q41_driver%5Blast%5D=Doe'); // clientNameLast field ID
    // Should not contain undefined or null values
    expect(url).not.toContain('undefined');
    expect(url).not.toContain('null');
  });
});
