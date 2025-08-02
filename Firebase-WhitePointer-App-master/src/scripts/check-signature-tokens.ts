import Database from 'better-sqlite3';
import path from 'path';

async function checkSignatureTokens() {
  console.log('Checking signature tokens in database...\n');
  
  try {
    // Open database directly
    const dbPath = path.join(process.cwd(), 'pbike-rescue.db');
    const db = new Database(dbPath);
    
    // Get all signature tokens
    const tokens = db.prepare('SELECT * FROM signature_tokens').all();
    
    console.log(`Found ${tokens.length} signature tokens:\n`);
    
    tokens.forEach((token: any, index: number) => {
      console.log(`Token ${index + 1}:`);
      console.log(`  ID: ${token.id}`);
      console.log(`  Token: ${token.token}`);
      console.log(`  Case ID: ${token.case_id}`);
      console.log(`  Status: ${token.status}`);
      console.log(`  Document Type: ${token.document_type}`);
      console.log(`  Client Email: ${token.client_email}`);
      console.log(`  Created At: ${token.created_at}`);
      console.log(`  Expires At: ${token.expires_at}`);
      console.log(`  Form Link: ${token.form_link}`);
      
      // Check if token is expired
      const expiresAt = new Date(token.expires_at);
      const now = new Date();
      const isExpired = now > expiresAt;
      console.log(`  Is Expired: ${isExpired}`);
      
      console.log('\n');
    });
    
    // Check for any active (non-expired, non-completed) tokens
    const activeTokens = tokens.filter((token: any) => {
      const expiresAt = new Date(token.expires_at);
      const now = new Date();
      return token.status !== 'completed' && now < expiresAt;
    });
    
    console.log(`Active tokens: ${activeTokens.length}`);
    
  } catch (error) {
    console.error('Error checking signature tokens:', error);
  }
}

checkSignatureTokens();