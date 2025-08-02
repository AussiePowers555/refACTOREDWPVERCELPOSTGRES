/**
 * Server-side storage fallback for when Firebase is not available
 * This provides a simple file-based storage for development/testing
 */

import { SignatureToken } from './database-schema';
import fs from 'fs';
import path from 'path';

// File-based storage path
const STORAGE_FILE = path.join(process.cwd(), '.dev-tokens.json');

// Helper functions for file-based storage
const loadTokensFromFile = (): Map<string, SignatureToken> => {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const tokens = JSON.parse(data);
      return new Map(Object.entries(tokens));
    }
  } catch (error) {
    console.error('Error loading tokens from file:', error);
  }
  return new Map();
};

const saveTokensToFile = (tokens: Map<string, SignatureToken>): void => {
  try {
    const data = Object.fromEntries(tokens);
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving tokens to file:', error);
  }
};

export const serverStorage = {
  // Store a signature token
  storeToken: (token: SignatureToken): void => {
    const tokens = loadTokensFromFile();
    tokens.set(token.token, token);
    saveTokensToFile(tokens);
    console.log('✅ Token stored in file storage:', token.token);
  },

  // Retrieve a signature token by token string
  getToken: (tokenString: string): SignatureToken | null => {
    const tokens = loadTokensFromFile();
    console.log('🔍 Searching for token:', tokenString);
    console.log('📁 Available tokens:', Array.from(tokens.keys()));
    const token = tokens.get(tokenString);
    if (token) {
      console.log('✅ Token found in file storage:', tokenString);
    } else {
      console.log('❌ Token not found in file storage:', tokenString);
    }
    return token || null;
  },

  // Update a signature token
  updateToken: (tokenString: string, updates: Partial<SignatureToken>): boolean => {
    const tokens = loadTokensFromFile();
    const existing = tokens.get(tokenString);
    if (existing) {
      const updated = { ...existing, ...updates };
      tokens.set(tokenString, updated);
      saveTokensToFile(tokens);
      console.log('✅ Token updated in file storage:', tokenString);
      return true;
    }
    console.log('❌ Token not found for update:', tokenString);
    return false;
  },

  // Update token form link specifically
  updateTokenFormLink: (tokenString: string, formLink: string): boolean => {
    const tokens = loadTokensFromFile();
    const existing = tokens.get(tokenString);
    if (existing) {
      const updated = { ...existing, form_link: formLink, updated_at: new Date() as any };
      tokens.set(tokenString, updated);
      saveTokensToFile(tokens);
      console.log('✅ Token form link updated in file storage:', tokenString);
      return true;
    }
    console.log('❌ Token not found for form link update:', tokenString);
    return false;
  },

  // Delete a signature token
  deleteToken: (tokenString: string): boolean => {
    const tokens = loadTokensFromFile();
    const deleted = tokens.delete(tokenString);
    if (deleted) {
      saveTokensToFile(tokens);
      console.log('✅ Token deleted from file storage:', tokenString);
    } else {
      console.log('❌ Token not found for deletion:', tokenString);
    }
    return deleted;
  },

  // List all tokens (for debugging)
  listTokens: (): SignatureToken[] => {
    const tokens = loadTokensFromFile();
    return Array.from(tokens.values());
  },

  // Clear all tokens
  clearAll: (): void => {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        fs.unlinkSync(STORAGE_FILE);
      }
      console.log('🧹 All tokens cleared from file storage');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }
};

// Export for debugging
export const getServerStorageStats = () => {
  const tokens = loadTokensFromFile();
  return {
    tokenCount: tokens.size,
    tokens: Array.from(tokens.keys())
  };
};
