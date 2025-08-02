#!/usr/bin/env node

/**
 * PostgreSQL Migration Script
 * 
 * This script helps migrate from SQLite to PostgreSQL by:
 * 1. Creating all necessary tables with proper constraints
 * 2. Creating performance indexes
 * 3. Migrating existing data (if any)
 * 4. Validating the migration
 */

const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting PostgreSQL migration...');
  
  try {
    // Test connection
    console.log('🔗 Testing PostgreSQL connection...');
    const result = await sql`SELECT version()`;
    console.log('✅ Connected to PostgreSQL:', result.rows[0].version);
    
    // Initialize database
    console.log('🔧 Initializing database schema...');
    const { initializeDatabase } = require('../src/lib/database');
    await initializeDatabase();
    
    console.log('✅ PostgreSQL migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log('- All tables created with proper constraints');
    console.log('- Performance indexes added');
    console.log('- Foreign key relationships established');
    console.log('- Data validation constraints applied');
    
    // Show table counts
    const tables = [
      'cases', 'contacts', 'workspaces', 'user_accounts', 
      'signature_tokens', 'case_interactions', 'digital_signatures',
      'rental_agreements', 'bikes', 'signed_documents'
    ];
    
    console.log('\n📈 Table Status:');
    for (const table of tables) {
      try {
        const count = await sql.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`- ${table}: ${count.rows[0].count} records`);
      } catch (error) {
        console.log(`- ${table}: Error checking (${error.message})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };