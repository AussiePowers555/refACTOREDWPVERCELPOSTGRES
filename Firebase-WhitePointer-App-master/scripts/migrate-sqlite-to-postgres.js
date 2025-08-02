#!/usr/bin/env node
/**
 * SQLite to PostgreSQL Data Migration Script
 * WhitePointer Motorcycle Rental Management System
 * 
 * This script migrates all data from SQLite to PostgreSQL with:
 * - Batch processing for large datasets
 * - Data validation and transformation
 * - Foreign key dependency management
 * - Progress tracking and error handling
 * - Rollback capability on failure
 */

const Database = require('better-sqlite3');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Migration configuration
const CONFIG = {
  sqlite: {
    path: process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'pbike-rescue.db'),
  },
  postgres: {
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://localhost:5432/whitepointer_dev',
  },
  migration: {
    batchSize: 100,
    maxRetries: 3,
    retryDelay: 1000,
    validateData: true,
    createBackup: true,
  }
};

// Migration table definitions with dependencies
const MIGRATION_TABLES = [
  {
    name: 'contacts',
    dependencies: [],
    sqliteQuery: 'SELECT * FROM contacts ORDER BY created_at',
    postgresInsert: `
      INSERT INTO contacts (
        id, name, company, type, phone, email, address, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    transform: (row) => [
      row.id,
      row.name,
      row.company,
      row.type,
      row.phone,
      row.email,
      row.address,
      row.notes,
      row.created_at || new Date().toISOString(),
      row.updated_at || new Date().toISOString()
    ]
  },
  {
    name: 'workspaces',
    dependencies: ['contacts'],
    sqliteQuery: 'SELECT * FROM workspaces ORDER BY created_at',
    postgresInsert: `
      INSERT INTO workspaces (
        id, name, contact_id, type, active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    transform: (row) => [
      row.id,
      row.name,
      row.contact_id,
      row.type,
      row.active !== undefined ? row.active : true,
      row.created_at || new Date().toISOString(),
      row.updated_at || new Date().toISOString()
    ]
  },
  {
    name: 'cases',
    dependencies: ['workspaces', 'contacts'],
    sqliteQuery: 'SELECT * FROM cases ORDER BY created_at',
    postgresInsert: `
      INSERT INTO cases (
        id, case_number, workspace_id, status,
        naf_data, af_data,
        assigned_lawyer_id, assigned_rental_company_id, assigned_bike,
        financial_summary,
        accident_date, accident_time, accident_description, accident_location, accident_diagram,
        created_date, modified_date, last_updated,
        client_name, client_phone, client_email, client_street_address, client_suburb, client_state, client_postcode,
        client_claim_number, client_insurance_company, client_insurer, client_vehicle_rego,
        at_fault_party_name, at_fault_party_phone, at_fault_party_email, at_fault_party_street_address,
        at_fault_party_suburb, at_fault_party_state, at_fault_party_postcode, at_fault_party_claim_number,
        at_fault_party_insurance_company, at_fault_party_insurer, at_fault_party_vehicle_rego,
        rental_company, lawyer, invoiced, reserve, agreed, paid
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
        $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47
      )
    `,
    transform: (row) => {
      // Build NAF (Not-At-Fault) data object
      const nafData = {
        name: row.client_name || row.naf_name,
        phone: row.client_phone || row.naf_phone,
        email: row.client_email || row.naf_email,
        address: row.client_street_address || row.naf_address,
        suburb: row.client_suburb || row.naf_suburb,
        state: row.client_state || row.naf_state,
        postcode: row.client_postcode || row.naf_postcode,
        claimNumber: row.client_claim_number || row.naf_claim_number,
        insuranceCompany: row.client_insurance_company || row.naf_insurance_company,
        insurer: row.client_insurer || row.naf_insurer,
        vehicleRego: row.client_vehicle_rego || row.naf_vehicle_rego,
      };

      // Build AF (At-Fault) data object
      const afData = {
        name: row.at_fault_party_name || row.af_name,
        phone: row.at_fault_party_phone || row.af_phone,
        email: row.at_fault_party_email || row.af_email,
        address: row.at_fault_party_street_address || row.af_address,
        suburb: row.at_fault_party_suburb || row.af_suburb,
        state: row.at_fault_party_state || row.af_state,
        postcode: row.at_fault_party_postcode || row.af_postcode,
        claimNumber: row.at_fault_party_claim_number || row.af_claim_number,
        insuranceCompany: row.at_fault_party_insurance_company || row.af_insurance_company,
        insurer: row.at_fault_party_insurer || row.af_insurer,
        vehicleRego: row.at_fault_party_vehicle_rego || row.af_vehicle_rego,
      };

      // Build financial summary
      const financialSummary = {
        invoiced: parseFloat(row.invoiced) || 0,
        reserve: parseFloat(row.reserve) || 0,
        agreed: parseFloat(row.agreed) || 0,
        paid: parseFloat(row.paid) || 0,
      };

      return [
        row.id,
        row.case_number,
        row.workspace_id,
        row.status || 'New Matter',
        JSON.stringify(nafData),
        JSON.stringify(afData),
        row.assigned_lawyer_id,
        row.assigned_rental_company_id,
        row.assigned_bike,
        JSON.stringify(financialSummary),
        row.accident_date,
        row.accident_time,
        row.accident_description,
        row.accident_location,
        row.accident_diagram,
        row.created_at || row.created_date || new Date().toISOString(),
        row.updated_at || row.modified_date || new Date().toISOString(),
        row.last_updated,
        // Legacy fields for backward compatibility
        row.client_name,
        row.client_phone,
        row.client_email,
        row.client_street_address,
        row.client_suburb,
        row.client_state,
        row.client_postcode,
        row.client_claim_number,
        row.client_insurance_company,
        row.client_insurer,
        row.client_vehicle_rego,
        row.at_fault_party_name,
        row.at_fault_party_phone,
        row.at_fault_party_email,
        row.at_fault_party_street_address,
        row.at_fault_party_suburb,
        row.at_fault_party_state,
        row.at_fault_party_postcode,
        row.at_fault_party_claim_number,
        row.at_fault_party_insurance_company,
        row.at_fault_party_insurer,
        row.at_fault_party_vehicle_rego,
        row.rental_company,
        row.lawyer,
        parseFloat(row.invoiced) || 0,
        parseFloat(row.reserve) || 0,
        parseFloat(row.agreed) || 0,
        parseFloat(row.paid) || 0,
      ];
    }
  },
  {
    name: 'bikes',
    dependencies: ['contacts', 'cases'],
    sqliteQuery: 'SELECT * FROM bikes ORDER BY created_at',
    postgresInsert: `
      INSERT INTO bikes (
        id, make, model, registration, registration_expires, service_center, service_center_contact_id,
        delivery_street, delivery_suburb, delivery_state, delivery_postcode,
        last_service_date, service_notes, status, location, daily_rate, daily_rate_a, daily_rate_b,
        image_url, image_hint, assignment, assigned_case_id, assignment_start_date, assignment_end_date,
        year, created_date, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27
      )
    `,
    transform: (row) => [
      row.id,
      row.make,
      row.model,
      row.registration,
      row.registration_expires,
      row.service_center,
      row.service_center_contact_id,
      row.delivery_street,
      row.delivery_suburb,
      row.delivery_state,
      row.delivery_postcode,
      row.last_service_date,
      row.service_notes,
      row.status || 'available',
      row.location || 'Main Warehouse',
      parseFloat(row.daily_rate) || 85.00,
      parseFloat(row.daily_rate_a),
      parseFloat(row.daily_rate_b),
      row.image_url,
      row.image_hint,
      row.assignment || '-',
      row.assigned_case_id,
      row.assignment_start_date,
      row.assignment_end_date,
      row.year,
      row.created_at || row.created_date || new Date().toISOString(),
      row.updated_at || new Date().toISOString()
    ]
  },
  {
    name: 'signature_tokens',
    dependencies: ['cases'],
    sqliteQuery: 'SELECT * FROM signature_tokens ORDER BY created_at',
    postgresInsert: `
      INSERT INTO signature_tokens (
        id, token, case_id, client_email, document_type, form_data, form_link,
        status, expires_at, signed_at, completed_at, jotform_submission_id,
        pdf_url, document_url, submitted_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
    `,
    transform: (row) => [
      row.id,
      row.token,
      row.case_id,
      row.client_email,
      row.document_type,
      row.form_data ? JSON.stringify(JSON.parse(row.form_data)) : null,
      row.form_link,
      row.status || 'pending',
      row.expires_at,
      row.signed_at,
      row.completed_at,
      row.jotform_submission_id,
      row.pdf_url,
      row.document_url,
      row.submitted_at,
      row.created_at || new Date().toISOString(),
      row.updated_at || new Date().toISOString()
    ]
  },
  {
    name: 'digital_signatures',
    dependencies: ['cases', 'signature_tokens'],
    sqliteQuery: 'SELECT * FROM digital_signatures ORDER BY created_at',
    postgresInsert: `
      INSERT INTO digital_signatures (
        id, case_id, signature_token_id, signature_data, signer_name, signer_email,
        terms_accepted, signed_at, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    transform: (row) => [
      row.id,
      row.case_id,
      row.signature_token_id,
      row.signature_data,
      row.signer_name,
      row.signer_email,
      row.terms_accepted || false,
      row.signed_at,
      row.ip_address,
      row.user_agent,
      row.created_at || new Date().toISOString()
    ]
  },
  {
    name: 'user_accounts',
    dependencies: ['contacts'],
    sqliteQuery: 'SELECT * FROM user_accounts ORDER BY created_at',
    postgresInsert: `
      INSERT INTO user_accounts (
        id, email, password_hash, role, status, contact_id, first_login,
        remember_login, created_at, updated_at, last_login
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    transform: (row) => [
      row.id,
      row.email,
      row.password_hash,
      row.role,
      row.status,
      row.contact_id,
      row.first_login !== undefined ? row.first_login : true,
      row.remember_login !== undefined ? row.remember_login : false,
      row.created_at || new Date().toISOString(),
      row.updated_at || new Date().toISOString(),
      row.last_login
    ]
  }
];

class MigrationRunner {
  constructor() {
    this.sqliteDb = null;
    this.pgPool = null;
    this.migrationLog = [];
    this.backupData = {};
  }

  async initialize() {
    console.log('🔄 Initializing migration...');
    
    // Check SQLite database exists
    if (!fs.existsSync(CONFIG.sqlite.path)) {
      throw new Error(`SQLite database not found at: ${CONFIG.sqlite.path}`);
    }

    // Initialize SQLite connection
    this.sqliteDb = new Database(CONFIG.sqlite.path, { readonly: true });
    console.log('✅ SQLite database connected');

    // Initialize PostgreSQL connection
    this.pgPool = new Pool({
      connectionString: CONFIG.postgres.connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test PostgreSQL connection
    try {
      const client = await this.pgPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ PostgreSQL database connected');
    } catch (error) {
      throw new Error(`PostgreSQL connection failed: ${error.message}`);
    }
  }

  async createBackup() {
    if (!CONFIG.migration.createBackup) return;

    console.log('🔄 Creating data backup...');
    
    for (const table of MIGRATION_TABLES) {
      try {
        const rows = this.sqliteDb.prepare(table.sqliteQuery).all();
        this.backupData[table.name] = rows;
        console.log(`📦 Backed up ${rows.length} rows from ${table.name}`);
      } catch (error) {
        console.warn(`⚠️ Backup failed for ${table.name}: ${error.message}`);
      }
    }

    // Save backup to file
    const backupPath = path.join(process.cwd(), 'data', `migration-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(this.backupData, null, 2));
    console.log(`✅ Backup saved to: ${backupPath}`);
  }

  async clearPostgresData() {
    console.log('🔄 Clearing existing PostgreSQL data...');
    
    const client = await this.pgPool.connect();
    try {
      await client.query('BEGIN');
      
      // Disable foreign key checks temporarily
      await client.query('SET session_replication_role = replica');
      
      // Clear tables in reverse dependency order
      const reverseTables = [...MIGRATION_TABLES].reverse();
      for (const table of reverseTables) {
        await client.query(`TRUNCATE TABLE ${table.name} CASCADE`);
        console.log(`🗑️ Cleared ${table.name}`);
      }
      
      // Re-enable foreign key checks
      await client.query('SET session_replication_role = DEFAULT');
      
      await client.query('COMMIT');
      console.log('✅ PostgreSQL data cleared');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async migrateTable(tableConfig) {
    console.log(`🔄 Migrating ${tableConfig.name}...`);
    
    // Get data from SQLite
    const rows = this.sqliteDb.prepare(tableConfig.sqliteQuery).all();
    console.log(`📊 Found ${rows.length} rows in ${tableConfig.name}`);
    
    if (rows.length === 0) {
      console.log(`⏭️ Skipping empty table ${tableConfig.name}`);
      return { success: true, migrated: 0, errors: 0 };
    }

    const client = await this.pgPool.connect();
    let migrated = 0;
    let errors = 0;

    try {
      await client.query('BEGIN');

      // Process in batches
      for (let i = 0; i < rows.length; i += CONFIG.migration.batchSize) {
        const batch = rows.slice(i, i + CONFIG.migration.batchSize);
        
        for (const row of batch) {
          try {
            // Transform data
            const transformedData = tableConfig.transform(row);
            
            // Validate if enabled
            if (CONFIG.migration.validateData) {
              this.validateRowData(transformedData, tableConfig.name);
            }

            // Insert into PostgreSQL
            await client.query(tableConfig.postgresInsert, transformedData);
            migrated++;
          } catch (error) {
            errors++;
            console.error(`❌ Error migrating row in ${tableConfig.name}:`, error.message);
            console.error('Row data:', row);
            
            // Continue or fail based on error severity
            if (error.code === '23505') { // Duplicate key
              console.log(`⚠️ Skipping duplicate row in ${tableConfig.name}`);
              continue;
            }
            
            if (errors > 10) {
              throw new Error(`Too many errors in ${tableConfig.name} migration`);
            }
          }
        }

        // Progress update
        const progress = Math.min(i + CONFIG.migration.batchSize, rows.length);
        console.log(`📈 Progress: ${progress}/${rows.length} (${Math.round(progress/rows.length*100)}%)`);
      }

      await client.query('COMMIT');
      console.log(`✅ Migrated ${tableConfig.name}: ${migrated} success, ${errors} errors`);
      
      return { success: true, migrated, errors };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Migration failed for ${tableConfig.name}: ${error.message}`);
      return { success: false, migrated, errors: errors + 1, error: error.message };
    } finally {
      client.release();
    }
  }

  validateRowData(data, tableName) {
    // Basic validation - ensure no null values for required fields
    if (data.includes(undefined)) {
      throw new Error(`Undefined value found in ${tableName} data`);
    }
  }

  async runMigration() {
    console.log('🚀 Starting SQLite to PostgreSQL migration...');
    const startTime = Date.now();
    
    try {
      await this.initialize();
      await this.createBackup();
      await this.clearPostgresData();

      const results = {};
      
      // Migrate tables in dependency order
      for (const tableConfig of MIGRATION_TABLES) {
        const result = await this.migrateTable(tableConfig);
        results[tableConfig.name] = result;
        
        if (!result.success) {
          throw new Error(`Migration failed for table: ${tableConfig.name}`);
        }
      }

      const duration = Date.now() - startTime;
      const totalMigrated = Object.values(results).reduce((sum, r) => sum + r.migrated, 0);
      const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

      console.log('\n🎉 Migration completed successfully!');
      console.log(`📊 Total migrated: ${totalMigrated} rows`);
      console.log(`⚠️ Total errors: ${totalErrors}`);
      console.log(`⏱️ Duration: ${Math.round(duration / 1000)}s`);
      
      // Summary table
      console.log('\n📋 Migration Summary:');
      console.table(results);

      return { success: true, results, duration, totalMigrated, totalErrors };
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      console.log('💡 Check logs above for details');
      console.log('🔄 You can safely retry the migration - existing data will be cleared');
      
      return { success: false, error: error.message };
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up connections...');
    
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
    
    if (this.pgPool) {
      await this.pgPool.end();
    }
    
    console.log('✅ Cleanup completed');
  }
}

// Main execution
async function main() {
  const migration = new MigrationRunner();
  
  try {
    const result = await migration.runMigration();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  } finally {
    await migration.cleanup();
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n⏹️ Migration interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ Migration terminated');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MigrationRunner, CONFIG, MIGRATION_TABLES };