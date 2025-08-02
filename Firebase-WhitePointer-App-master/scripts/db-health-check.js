#!/usr/bin/env node

/**
 * PostgreSQL Database Health Check Script
 * 
 * This script validates the PostgreSQL database setup:
 * 1. Tests connection
 * 2. Validates schema
 * 3. Checks indexes
 * 4. Tests basic operations
 * 5. Reports performance metrics
 */

const { sql } = require('@vercel/postgres');

async function healthCheck() {
  console.log('🏥 PostgreSQL Database Health Check\n');
  
  let score = 0;
  const maxScore = 100;
  
  try {
    // 1. Connection Test (10 points)
    console.log('🔗 Testing database connection...');
    const startTime = Date.now();
    const version = await sql`SELECT version(), current_database(), current_user`;
    const connectionTime = Date.now() - startTime;
    
    console.log(`✅ Connected in ${connectionTime}ms`);
    console.log(`   Database: ${version.rows[0].current_database}`);
    console.log(`   User: ${version.rows[0].current_user}`);
    console.log(`   Version: ${version.rows[0].version.split(' ')[0]} ${version.rows[0].version.split(' ')[1]}\n`);
    score += 10;
    
    // 2. Schema Validation (30 points)
    console.log('📋 Validating database schema...');
    const requiredTables = [
      'cases', 'contacts', 'workspaces', 'user_accounts', 
      'signature_tokens', 'case_interactions', 'digital_signatures',
      'rental_agreements', 'bikes', 'signed_documents'
    ];
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    
    const tableNames = tables.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length === 0) {
      console.log(`✅ All ${requiredTables.length} required tables present`);
      score += 20;
    } else {
      console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
    }
    
    // Check constraints
    const constraints = await sql`
      SELECT conname, contype 
      FROM pg_constraint 
      JOIN pg_class ON conrelid = pg_class.oid 
      WHERE pg_class.relname IN (${requiredTables.map(() => '?').join(',')})
    `;
    
    console.log(`   Constraints: ${constraints.rows.length} defined`);
    if (constraints.rows.length > 10) score += 10;
    
    // 3. Index Validation (20 points)
    console.log('\n🏃 Checking database indexes...');
    const indexes = await sql`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
    `;
    
    console.log(`   Custom indexes: ${indexes.rows.length}`);
    if (indexes.rows.length >= 20) {
      console.log('✅ Good index coverage');
      score += 20;
    } else if (indexes.rows.length >= 10) {
      console.log('⚠️  Moderate index coverage');
      score += 10;
    } else {
      console.log('❌ Poor index coverage');
    }
    
    // 4. Performance Test (20 points)
    console.log('\n⚡ Testing query performance...');
    
    // Test cases table query
    const queryStart = Date.now();
    const caseCount = await sql`SELECT COUNT(*) as count FROM cases`;
    const queryTime = Date.now() - queryStart;
    
    console.log(`   Cases table: ${caseCount.rows[0].count} records (${queryTime}ms)`);
    
    if (queryTime < 100) {
      console.log('✅ Fast query performance');  
      score += 20;
    } else if (queryTime < 500) {
      console.log('⚠️  Moderate query performance');
      score += 10;
    } else {
      console.log('❌ Slow query performance');
    }
    
    // 5. Data Integrity (20 points)
    console.log('\n🔒 Checking data integrity...');
    
    try {
      // Test foreign key constraints
      const fkTest = await sql`
        SELECT COUNT(*) as violations 
        FROM cases c 
        LEFT JOIN workspaces w ON c.workspace_id = w.id 
        WHERE c.workspace_id IS NOT NULL AND w.id IS NULL
      `;
      
      if (fkTest.rows[0].violations === '0') {
        console.log('✅ No foreign key violations');
        score += 10;
      } else {
        console.log(`❌ ${fkTest.rows[0].violations} foreign key violations`);
      }
      
      // Test data constraints
      const constraintTest = await sql`
        SELECT COUNT(*) as violations 
        FROM cases 
        WHERE client_email IS NOT NULL AND client_email !~ '^[^@]+@[^@]+\.[^@]+$'
      `;
      
      if (constraintTest.rows[0].violations === '0') {
        console.log('✅ No constraint violations');
        score += 10;
      } else {
        console.log(`❌ ${constraintTest.rows[0].violations} constraint violations`);
      }
      
    } catch (error) {
      console.log('⚠️  Could not verify all constraints:', error.message);
      score += 5;
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return 0;
  }
  
  // Final Score
  console.log('\n' + '='.repeat(50));
  console.log(`🏥 Database Health Score: ${score}/${maxScore} (${Math.round(score/maxScore*100)}%)`);
  
  if (score >= 90) {
    console.log('🎉 Excellent! Database is in great shape.');
  } else if (score >= 70) {
    console.log('👍 Good! Database is working well with minor issues.');
  } else if (score >= 50) {
    console.log('⚠️  Fair! Database needs some attention.');
  } else {
    console.log('❌ Poor! Database requires immediate fixes.');
  }
  
  return score;
}

// Run if called directly
if (require.main === module) {
  healthCheck()
    .then(score => {
      process.exit(score >= 70 ? 0 : 1);
    })
    .catch(error => {
      console.error('Health check error:', error);
      process.exit(1);
    });
}

module.exports = { healthCheck };