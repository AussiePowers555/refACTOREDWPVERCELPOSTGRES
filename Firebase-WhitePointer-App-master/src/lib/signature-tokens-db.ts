import { DatabaseService, ensureDatabaseInitialized } from './database';
import { DocumentType } from './database-schema';
import crypto from 'crypto';

/**
 * Generate a secure SHA256 token for signature access
 */
export function generateSignatureToken(): string {
  const randomBytes = crypto.randomBytes(32);
  return crypto.createHash('sha256').update(randomBytes).digest('hex');
}

/**
 * Create a new signature token
 */
export async function createSignatureToken(
  caseId: string,
  clientEmail: string,
  documentType: DocumentType,
  formData: any,
  formLink: string
): Promise<string> {
  ensureDatabaseInitialized();
  
  const token = generateSignatureToken();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours

  const signatureTokenData = {
    token,
    case_id: caseId,
    client_email: clientEmail,
    form_data: formData,
            status: 'pending' as const,
    expires_at: expiresAt,
    document_type: documentType,
    form_link: formLink
  };

  try {
    const createdToken = await DatabaseService.createSignatureToken({
            created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...signatureTokenData
    });
    console.log('✅ Signature token created in database:', { id: createdToken.id, token });
    return token;
  } catch (error) {
    console.error('Error creating signature token:', error);
    throw new Error('Failed to create signature token');
  }
}

/**
 * Retrieve a signature token by token string
 */
export async function getSignatureToken(token: string): Promise<any | null> {
  try {
    ensureDatabaseInitialized();
    const result = await DatabaseService.getSignatureToken(token);
    return result;
  } catch (error) {
    console.error('Error retrieving signature token:', error);
    return null;
  }
}

/**
 * Validate if a token is valid and not expired
 */
export function isTokenValid(signatureToken: any): boolean {
  const now = new Date();
  const expiresAt = new Date(signatureToken.expires_at);
  
  return (
    signatureToken.status !== 'expired' &&
    signatureToken.status !== 'completed' &&
    now < expiresAt
  );
}

/**
 * Update signature token status
 */
export async function updateSignatureTokenStatus(
  tokenId: string,
  status: string,
  additionalData?: any
): Promise<void> {
  try {
    ensureDatabaseInitialized();
    const updateData: any = {
      status,
      ...additionalData
    };

    // Add timestamps for specific status changes
    if (status === 'signed') {
      updateData.signed_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    await DatabaseService.updateSignatureToken(tokenId, updateData);
    console.log('Signature token status updated:', { tokenId, status });
  } catch (error) {
    console.error('Error updating signature token status:', error);
    throw new Error('Failed to update signature token status');
  }
}

/**
 * Mark token as accessed (when user visits the signature portal)
 */
export async function markTokenAsAccessed(token: string): Promise<any | null> {
  const signatureToken = await getSignatureToken(token);
  
  if (!signatureToken) {
    return null;
  }

  // Check if token is still valid
  if (!isTokenValid(signatureToken)) {
    await updateSignatureTokenStatus(signatureToken.id, 'expired');
    return null;
  }

  // Mark as accessed if it's still pending
  if (signatureToken.status === 'pending') {
    await updateSignatureTokenStatus(signatureToken.id, 'accessed');
    signatureToken.status = 'accessed';
  }

  return signatureToken;
}

/**
 * Complete the signature process
 */
export async function completeSignatureToken(
  token: string,
  jotformSubmissionId: string
): Promise<void> {
  const signatureToken = await getSignatureToken(token);
  
  if (!signatureToken) {
    throw new Error('Signature token not found');
  }

  await updateSignatureTokenStatus(signatureToken.id, 'completed', {
    jotform_submission_id: jotformSubmissionId
  });
}

/**
 * Get all signature tokens for a case
 */
export async function getSignatureTokensForCase(caseId: string): Promise<any[]> {
  try {
    ensureDatabaseInitialized();
    return await DatabaseService.getSignatureTokensForCase(caseId);
  } catch (error) {
    console.error('Error retrieving signature tokens for case:', error);
    throw new Error('Failed to retrieve signature tokens for case');
  }
}

/**
 * Check if a case already has a pending signature token for a document type
 */
export async function hasPendingSignatureToken(
  caseId: string,
  documentType: DocumentType
): Promise<boolean> {
  try {
    ensureDatabaseInitialized();
    const tokens = await DatabaseService.getSignatureTokensForCase(caseId);
    return tokens.some(token =>
      token.document_type === documentType &&
      (token.status === 'pending' || token.status === 'accessed')
    );
  } catch (error) {
    console.error('Error checking for pending signature token:', error);
    return false;
  }
}

/**
 * Update signature token with correct form link
 */
export async function updateSignatureTokenFormLink(
  token: string,
  formLink: string
): Promise<void> {
  try {
    ensureDatabaseInitialized();
    const existingToken = await DatabaseService.getSignatureToken(token);
    
    if (!existingToken) {
      console.error('Token not found for update:', token);
      return;
    }

    await DatabaseService.updateSignatureToken(existingToken.id, {
      form_link: formLink
    });

    console.log('✅ Updated token with form link:', { token, formLink });
  } catch (error) {
    console.error('Error updating token with form link:', error);
    throw new Error('Failed to update signature token form link');
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    ensureDatabaseInitialized();
    // This would need a custom query in the DatabaseService
    console.log('Token cleanup not yet implemented for SQLite');
    return 0;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    throw new Error('Failed to clean up expired tokens');
  }
}