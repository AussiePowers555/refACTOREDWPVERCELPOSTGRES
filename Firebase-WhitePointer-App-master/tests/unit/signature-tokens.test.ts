import { test, expect } from '@playwright/test';
import { generateSignatureToken, isTokenValid } from '../../src/lib/signature-tokens';
import { SignatureToken } from '../../src/lib/database-schema';

test.describe('Signature Token Management', () => {
  test('generateSignatureToken creates unique tokens', () => {
    const token1 = generateSignatureToken();
    const token2 = generateSignatureToken();
    
    expect(token1).toBeTruthy();
    expect(token2).toBeTruthy();
    expect(token1).not.toBe(token2);
    expect(token1).toHaveLength(64); // SHA256 hex string length
    expect(token2).toHaveLength(64);
  });

  test('isTokenValid returns true for valid tokens', () => {
    const validToken: SignatureToken = {
      id: 'token-1',
      token: 'valid-token',
      case_id: 'TEST001',
      client_email: 'test@example.com',
      form_data: '{}',
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      document_type: 'claims',
      form_link: 'https://example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    expect(isTokenValid(validToken)).toBe(true);
  });

  test('isTokenValid returns false for expired tokens', () => {
    const expiredToken: SignatureToken = {
      id: 'token-2',
      token: 'expired-token',
      case_id: 'TEST001',
      client_email: 'test@example.com',
      form_data: '{}',
      status: 'pending',
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      document_type: 'claims',
      form_link: 'https://example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    expect(isTokenValid(expiredToken)).toBe(false);
  });

  test('isTokenValid returns false for completed tokens', () => {
    const completedToken: SignatureToken = {
      id: 'token-3',
      token: 'completed-token',
      case_id: 'TEST001',
      client_email: 'test@example.com',
      form_data: '{}',
      status: 'completed',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      document_type: 'claims',
      form_link: 'https://example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    expect(isTokenValid(completedToken)).toBe(false);
  });

  test('isTokenValid returns false for explicitly expired status', () => {
    const expiredStatusToken: SignatureToken = {
      id: 'token-4',
      token: 'expired-status-token',
      case_id: 'TEST001',
      client_email: 'test@example.com',
      form_data: '{}',
      status: 'expired',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      document_type: 'claims',
      form_link: 'https://example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    expect(isTokenValid(expiredStatusToken)).toBe(false);
  });
});
