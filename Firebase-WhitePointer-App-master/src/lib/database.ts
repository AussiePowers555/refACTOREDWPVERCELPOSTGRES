// Server-side only imports
let Database: any;
let path: any;
let fs: any;

// Only import on server side
if (typeof window === 'undefined') {
  Database = require('better-sqlite3');
  path = require('path');
  fs = require('fs');
}
// Import from unified schema - SINGLE SOURCE OF TRUTH
import type {
  Case,
  Contact,
  Workspace,
  UserAccount,
  CaseFrontend,
  ContactFrontend,
  WorkspaceFrontend,
  BikeFrontend
} from './database-schema';
import { SchemaTransformers } from './database-schema';

// Database file will be stored in the project root
let DB_PATH: string;
let dbDir: string;

// Only initialize on server side
if (typeof window === 'undefined' && path && fs) {
  // Use environment variable for database path (Render persistent disk)
  const dataDir = process.env.DATABASE_PATH ? path.dirname(process.env.DATABASE_PATH) : path.join(process.cwd(), 'data');
  DB_PATH = process.env.DATABASE_PATH || path.join(dataDir, 'pbike-rescue.db');
  
  // Ensure database directory exists
  dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  console.log(`📁 Database will be stored at: ${DB_PATH}`);
}

let db: any;

// Initialize database with tables
export function initializeDatabase() {
  // Only run on server side
  if (typeof window !== 'undefined') {
    throw new Error('Database initialization must be performed server-side only');
  }
  
  if (db) return db;
  
  if (!Database || !DB_PATH) {
    throw new Error('Database modules not available - ensure running server-side');
  }
  
  console.log(`📁 Database path: ${DB_PATH}`);
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // Better performance
  
  // Create tables
  createTables();
  seedInitialData();
  
  console.log('✅ SQLite database initialized');
  return db;
}

function createTables() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  // Cases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      case_number TEXT UNIQUE NOT NULL,
      workspace_id TEXT,
      status TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_email TEXT,
      client_street_address TEXT,
      client_suburb TEXT,
      client_state TEXT,
      client_postcode TEXT,
      client_claim_number TEXT,
      client_insurance_company TEXT,
      client_insurer TEXT,
      client_vehicle_rego TEXT,
      at_fault_party_name TEXT NOT NULL,
      at_fault_party_phone TEXT,
      at_fault_party_email TEXT,
      at_fault_party_street_address TEXT,
      at_fault_party_suburb TEXT,
      at_fault_party_state TEXT,
      at_fault_party_postcode TEXT,
      at_fault_party_claim_number TEXT,
      at_fault_party_insurance_company TEXT,
      at_fault_party_insurer TEXT,
      at_fault_party_vehicle_rego TEXT,
      rental_company TEXT,
      lawyer TEXT,
      assigned_lawyer_id TEXT,
      assigned_rental_company_id TEXT,
      invoiced REAL DEFAULT 0,
      reserve REAL DEFAULT 0,
      agreed REAL DEFAULT 0,
      paid REAL DEFAULT 0,
      accident_date TEXT,
      accident_time TEXT,
      accident_description TEXT,
      accident_diagram TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_lawyer_id) REFERENCES contacts (id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_rental_company_id) REFERENCES contacts (id) ON DELETE SET NULL
    )
  `);

  // Contacts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      type TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Workspaces table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
    )
  `);

  // User accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_accounts (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      contact_id TEXT,
      first_login BOOLEAN DEFAULT TRUE,
      remember_login BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE SET NULL
    )
  `);

  // Signature tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS signature_tokens (
      id TEXT PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      case_id TEXT NOT NULL,
      client_email TEXT NOT NULL,
      document_type TEXT NOT NULL,
      form_data TEXT,
      form_link TEXT,
      status TEXT DEFAULT 'pending',
      expires_at DATETIME NOT NULL,
      signed_at DATETIME,
      completed_at DATETIME,
      jotform_submission_id TEXT,
      pdf_url TEXT,
      document_url TEXT,
      submitted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add missing columns to existing signature_tokens table
  try {
    db.exec(`ALTER TABLE signature_tokens ADD COLUMN pdf_url TEXT`);
  } catch (e) {
    // Column already exists, ignore error
  }

  try {
    db.exec(`ALTER TABLE signature_tokens ADD COLUMN document_url TEXT`);
  } catch (e) {
    // Column already exists, ignore error
  }

  try {
    db.exec(`ALTER TABLE signature_tokens ADD COLUMN submitted_at DATETIME`);
  } catch (e) {
    // Column already exists, ignore error
  }

  // Case interactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS case_interactions (
      id TEXT PRIMARY KEY,
      case_number TEXT NOT NULL,
      source TEXT NOT NULL,
      method TEXT NOT NULL,
      situation TEXT NOT NULL,
      action TEXT NOT NULL,
      outcome TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_number) REFERENCES cases (case_number) ON DELETE CASCADE
    )
  `);

  // Digital signatures table
  db.exec(`
    CREATE TABLE IF NOT EXISTS digital_signatures (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      signature_token_id TEXT,
      signature_data TEXT NOT NULL,
      signer_name TEXT NOT NULL,
      terms_accepted BOOLEAN DEFAULT FALSE,
      signed_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Rental agreements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rental_agreements (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      signature_id TEXT,
      rental_details TEXT,
      status TEXT DEFAULT 'draft',
      signed_at DATETIME,
      signed_by TEXT,
      pdf_url TEXT,
      pdf_path TEXT,
      pdf_generated_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bikes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bikes (
      id TEXT PRIMARY KEY,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      registration TEXT,
      registration_expires TEXT,
      service_center TEXT,
      delivery_street TEXT,
      delivery_suburb TEXT,
      delivery_state TEXT,
      delivery_postcode TEXT,
      last_service_date TEXT,
      service_notes TEXT,
      status TEXT DEFAULT 'Available',
      location TEXT DEFAULT 'Main Warehouse',
      daily_rate REAL DEFAULT 85.00,
      image_url TEXT,
      image_hint TEXT,
      assignment TEXT DEFAULT '-',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Signed documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS signed_documents (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      sha256_hash TEXT NOT NULL,
      signed_at DATETIME NOT NULL,
      signed_by TEXT NOT NULL,
      signature_data TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      encryption_key_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database tables created');
}

function seedInitialData() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  // Check if data already exists
  const contactCount = db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number };
  if (contactCount.count > 0) {
    console.log('📊 Database already has data, skipping seed');
    return;
  }

  console.log('🌱 Seeding initial data...');
  
  // Insert initial contacts
  const insertContact = db.prepare(`
    INSERT INTO contacts (id, name, company, type, phone, email, address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const initialContacts = [
    {
      id: "contact-david-001",
      name: "David",
      company: "Not At Fault",
      type: "Rental Company",
      phone: "0413063463",
      email: "whitepointer2016@gmail.com",
      address: "123 Business Street, Sydney NSW 2000"
    },
    {
      id: "contact-smith-lawyers",
      name: "Smith & Co Lawyers",
      company: "Smith & Co Legal",
      type: "Lawyer",
      phone: "02 9876 5432",
      email: "contact@smithlegal.com.au",
      address: "456 Legal Avenue, Sydney NSW 2000"
    },
    {
      id: "contact-davis-legal",
      name: "Davis Legal",
      company: "Davis & Associates",
      type: "Lawyer",
      phone: "02 8765 4321",
      email: "info@davislegal.com.au",
      address: "789 Law Street, Melbourne VIC 3000"
    },
    {
      id: "contact-citywide-rentals",
      name: "City Wide Rentals",
      company: "City Wide Vehicle Rentals",
      type: "Rental Company",
      phone: "1300 555 666",
      email: "bookings@citywiderentals.com.au",
      address: "321 Rental Avenue, Brisbane QLD 4000"
    }
  ];

  for (const contact of initialContacts) {
    insertContact.run(contact.id, contact.name, contact.company, contact.type, contact.phone, contact.email, contact.address);
  }

  // Insert initial workspaces
  const insertWorkspace = db.prepare(`
    INSERT INTO workspaces (id, name, contact_id)
    VALUES (?, ?, ?)
  `);

  const initialWorkspaces = [
    {
      id: "workspace-david-001",
      name: "David - Not At Fault Workspace",
      contactId: "contact-david-001"
    }
  ];

  for (const workspace of initialWorkspaces) {
    insertWorkspace.run(workspace.id, workspace.name, workspace.contactId);
  }

  // Insert initial cases
  const insertCase = db.prepare(`
    INSERT INTO cases (
      id, case_number, status, last_updated, client_name, client_phone, client_email,
      client_street_address, client_suburb, client_state, client_postcode,
      client_claim_number, client_insurance_company, client_insurer, client_vehicle_rego,
      at_fault_party_name, at_fault_party_phone, at_fault_party_email,
      at_fault_party_street_address, at_fault_party_suburb, at_fault_party_state,
      at_fault_party_postcode, at_fault_party_claim_number, at_fault_party_insurance_company,
      at_fault_party_insurer, at_fault_party_vehicle_rego, assigned_lawyer_id, assigned_rental_company_id,
      invoiced, reserve, agreed, paid, accident_date, accident_time, accident_description,
      rental_company, lawyer, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialCases = [
    {
      id: "case-001",
      caseNumber: "2025-001",
      status: "Invoiced",
      lastUpdated: "2 hours ago",
      clientName: "John Smith",
      clientPhone: "555-1111",
      clientEmail: "john.s@example.com",
      clientStreetAddress: "123 Main St",
      clientSuburb: "Anytown",
      clientState: "NSW",
      clientPostcode: "2000",
      clientClaimNumber: "C001",
      clientInsuranceCompany: "AllState",
      clientInsurer: "",
      clientVehicleRego: "ABC123",
      atFaultPartyName: "Jane Doe",
      atFaultPartyPhone: "555-2222",
      atFaultPartyEmail: "jane.d@example.com",
      atFaultPartyStreetAddress: "456 Oak Ave",
      atFaultPartySuburb: "Otherville",
      atFaultPartyState: "NSW",
      atFaultPartyPostcode: "2001",
      atFaultPartyClaimNumber: "AF001",
      atFaultPartyInsuranceCompany: "Geico",
      atFaultPartyInsurer: "",
      atFaultPartyVehicleRego: "XYZ789",
      invoiced: 5500,
      reserve: 5000,
      agreed: 5000,
      paid: 2500,
      accidentDate: "",
      accidentTime: "",
      accidentDescription: "",
      accidentDiagram: "",
      rentalCompany: "PBikeRescue Rentals",
      lawyer: "Smith & Co Lawyers"
    }
  ];

  for (const caseData of initialCases) {
    insertCase.run(
      caseData.id, caseData.caseNumber, caseData.status, caseData.lastUpdated,
      caseData.clientName, caseData.clientPhone, caseData.clientEmail,
      caseData.clientStreetAddress, caseData.clientSuburb, caseData.clientState, caseData.clientPostcode,
      caseData.clientClaimNumber, caseData.clientInsuranceCompany, caseData.clientInsurer, caseData.clientVehicleRego,
      caseData.atFaultPartyName, caseData.atFaultPartyPhone, caseData.atFaultPartyEmail,
      caseData.atFaultPartyStreetAddress, caseData.atFaultPartySuburb, caseData.atFaultPartyState,
      caseData.atFaultPartyPostcode, caseData.atFaultPartyClaimNumber, caseData.atFaultPartyInsuranceCompany,
      caseData.atFaultPartyInsurer, caseData.atFaultPartyVehicleRego, null, null,
      caseData.invoiced, caseData.reserve, caseData.agreed, caseData.paid, caseData.accidentDate, caseData.accidentTime, caseData.accidentDescription,
      caseData.rentalCompany, caseData.lawyer, new Date().toISOString()
    );
  }

  console.log('✅ Initial data seeded');
}

// Helper function to ensure server-side execution
function ensureServerSide() {
  if (typeof window !== 'undefined') {
    throw new Error('Database operations must be performed server-side only. Use API routes instead.');
  }
  if (!db) {
    throw new Error('Database not initialized');
  }
}

// Helper function to map database row to Case interface
// Map database row to Case schema (database format)
function mapDbRowToCase(row: any): Case {
  return {
    id: row.id,
    case_number: row.case_number,
    workspace_id: row.workspace_id,
    status: row.status,
    last_updated: row.last_updated,

    // Client (NAF) details - using new schema field names
    naf_name: row.client_name || row.naf_name,
    naf_phone: row.client_phone || row.naf_phone,
    naf_email: row.client_email || row.naf_email,
    naf_address: row.client_street_address || row.naf_address,
    naf_suburb: row.client_suburb || row.naf_suburb,
    naf_state: row.client_state || row.naf_state,
    naf_postcode: row.client_postcode || row.naf_postcode,
    naf_claim_number: row.client_claim_number || row.naf_claim_number,
    naf_insurance_company: row.client_insurance_company || row.naf_insurance_company,
    naf_insurer: row.client_insurer || row.naf_insurer,
    naf_vehicle_rego: row.client_vehicle_rego || row.naf_vehicle_rego,

    // At-fault party details
    af_name: row.at_fault_party_name || row.af_name,
    af_phone: row.at_fault_party_phone || row.af_phone,
    af_email: row.at_fault_party_email || row.af_email,
    af_address: row.at_fault_party_street_address || row.af_address,
    af_suburb: row.at_fault_party_suburb || row.af_suburb,
    af_state: row.at_fault_party_state || row.af_state,
    af_postcode: row.at_fault_party_postcode || row.af_postcode,
    af_claim_number: row.at_fault_party_claim_number || row.af_claim_number,
    af_insurance_company: row.at_fault_party_insurance_company || row.af_insurance_company,
    af_insurer: row.at_fault_party_insurer || row.af_insurer,
    af_vehicle_rego: row.at_fault_party_vehicle_rego || row.af_vehicle_rego,

    // Assignments and financial
    assigned_lawyer_id: row.assigned_lawyer_id,
    assigned_rental_company_id: row.assigned_rental_company_id,
    invoiced: row.invoiced || 0,
    reserve: row.reserve || 0,
    agreed: row.agreed || 0,
    paid: row.paid || 0,

    // Accident details
    accident_date: row.accident_date,
    accident_time: row.accident_time,
    accident_description: row.accident_description,
    accident_diagram: row.accident_diagram,

    // Timestamps
    created_date: row.created_at || row.created_date || new Date().toISOString(),
    modified_date: row.updated_at || row.modified_date || new Date().toISOString()
  };
}

// Map database row to frontend-friendly format
function mapDbRowToCaseFrontend(row: any): CaseFrontend {
  const dbCase = mapDbRowToCase(row);
  return SchemaTransformers.caseDbToFrontend(dbCase);
}

import { SignatureToken, DigitalSignature, RentalAgreement, Bike } from './database-schema';

// Direct SQLite implementation - no factory pattern needed
export const DatabaseService = {
  // Case methods
  createCase: (caseData: any): any => {
    ensureServerSide();
    const id = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO cases (
        id, case_number, status, last_updated, client_name, client_email, client_phone,
        client_street_address, client_suburb, client_state, client_postcode,
        client_claim_number, client_insurance_company, client_insurer,
        at_fault_party_name, at_fault_party_email, at_fault_party_phone,
        at_fault_party_street_address, at_fault_party_suburb, at_fault_party_state, at_fault_party_postcode,
        at_fault_party_claim_number, at_fault_party_insurance_company, at_fault_party_insurer,
        rental_company, lawyer, invoiced, reserve, agreed, paid, workspace_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    stmt.run(
      id,
      caseData.caseNumber || caseData.case_number,
      caseData.status || 'Active',
      now,
      caseData.clientName || caseData.client_name,
      caseData.clientEmail || caseData.client_email,
      caseData.clientPhone || caseData.client_phone,
      caseData.clientStreetAddress || caseData.client_street_address,
      caseData.clientSuburb || caseData.client_suburb,
      caseData.clientState || caseData.client_state,
      caseData.clientPostcode || caseData.client_postcode,
      caseData.clientClaimNumber || caseData.client_claim_number,
      caseData.clientInsuranceCompany || caseData.client_insurance_company,
      caseData.clientInsurer || caseData.client_insurer,
      caseData.atFaultPartyName || caseData.at_fault_party_name,
      caseData.atFaultPartyEmail || caseData.at_fault_party_email,
      caseData.atFaultPartyPhone || caseData.at_fault_party_phone,
      caseData.atFaultPartyStreetAddress || caseData.at_fault_party_street_address,
      caseData.atFaultPartySuburb || caseData.at_fault_party_suburb,
      caseData.atFaultPartyState || caseData.at_fault_party_state,
      caseData.atFaultPartyPostcode || caseData.at_fault_party_postcode,
      caseData.atFaultPartyClaimNumber || caseData.at_fault_party_claim_number,
      caseData.atFaultPartyInsuranceCompany || caseData.at_fault_party_insurance_company,
      caseData.atFaultPartyInsurer || caseData.at_fault_party_insurer,
      caseData.rentalCompany || caseData.rental_company,
      caseData.lawyer,
      caseData.invoiced || 0,
      caseData.reserve || 0,
      caseData.agreed || 0,
      caseData.paid || 0,
      caseData.workspaceId || caseData.workspace_id
    );

    return { id, ...caseData };
  },

  getAllCases: (): CaseFrontend[] => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM cases ORDER BY last_updated DESC');
    const rows = stmt.all();
    return rows.map(mapDbRowToCaseFrontend);
  },

  getCaseById: (id: string): CaseFrontend | null => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM cases WHERE id = ?');
    const row = stmt.get(id);
    return row ? mapDbRowToCaseFrontend(row) : null;
  },

  getCaseByCaseNumber: (caseNumber: string): CaseFrontend | null => {
    ensureServerSide();
    const row = db.prepare('SELECT * FROM cases WHERE case_number = ?').get(caseNumber);
    return row ? mapDbRowToCaseFrontend(row) : null;
  },

  updateCase: (id: string, updates: any): void => {
    ensureServerSide();
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => {
      // Map frontend field names to database column names
      const dbFieldMap: { [key: string]: string } = {
        'clientEmail': 'client_email',
        'clientPhone': 'client_phone',
        'clientName': 'client_name',
        'status': 'status',
        'lastUpdated': 'last_updated'
      };
      return `${dbFieldMap[field] || field} = ?`;
    }).join(', ');

    const stmt = db.prepare(`
      UPDATE cases
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, new Date().toISOString(), id);
  },

  deleteCase: (id: string): boolean => {
    ensureServerSide();
    const stmt = db.prepare('DELETE FROM cases WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // Contact methods
  getAllContacts: (): ContactFrontend[] => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM contacts ORDER BY name');
    const rows = stmt.all();
    return rows.map(SchemaTransformers.contactDbToFrontend);
  },

  createContact: (contactData: any): Contact => {
    ensureServerSide();
    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO contacts (id, name, company, type, phone, email, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, contactData.name, contactData.company, contactData.type,
             contactData.phone, contactData.email, contactData.address);

    return { id, ...contactData };
  },

  // Workspace methods
  getAllWorkspaces: (): WorkspaceFrontend[] => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM workspaces ORDER BY name');
    const rows = stmt.all();
    return rows.map(SchemaTransformers.workspaceDbToFrontend);
  },

  createWorkspace: (workspaceData: any): Workspace => {
    ensureServerSide();
    const id = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO workspaces (id, name, contact_id, type)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, workspaceData.name, workspaceData.contact_id, workspaceData.type);

    return { id, ...workspaceData };
  },

  updateWorkspace: (id: string, updates: any): void => {
    ensureServerSide();
    const stmt = db.prepare(`
      UPDATE workspaces
      SET name = ?, contact_id = ?, type = ?
      WHERE id = ?
    `);
    stmt.run(updates.name, updates.contact_id, updates.type, id);
  },

  deleteWorkspace: (id: string): void => {
    ensureServerSide();
    const stmt = db.prepare('DELETE FROM workspaces WHERE id = ?');
    stmt.run(id);
  },

  // User Account methods
  getAllUserAccounts: (): UserAccount[] => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM user_accounts ORDER BY email');
    return stmt.all();
  },

  createUserAccount: (userData: any): UserAccount => {
    ensureServerSide();
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO user_accounts (id, email, password_hash, role, status, contact_id, first_login, remember_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, userData.email, userData.password_hash, userData.role,
             userData.status, userData.contact_id, userData.first_login, userData.remember_login);

    return { id, ...userData };
  },

  getUserByEmail: (email: string): UserAccount | null => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM user_accounts WHERE email = ?');
    return stmt.get(email);
  },

  updateUserAccount: (id: string, updates: any): void => {
    ensureServerSide();
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const stmt = db.prepare(`
      UPDATE user_accounts
      SET ${setClause}
      WHERE id = ?
    `);

    stmt.run(...values, id);
  },

  // Signature Token methods
  createSignatureToken: (tokenData: any): SignatureToken => {
    ensureServerSide();
    const id = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO signature_tokens (
        id, token, case_id, client_email, document_type, form_data,
        form_link, status, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    stmt.run(
      id, tokenData.token, tokenData.case_id, tokenData.client_email,
      tokenData.document_type, tokenData.form_data, tokenData.form_link,
      tokenData.status, tokenData.expires_at,
      tokenData.created_at || now, tokenData.updated_at || now
    );

    return { id, ...tokenData };
  },

  getSignatureTokenByToken: (token: string): SignatureToken | null => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM signature_tokens WHERE token = ?');
    return stmt.get(token);
  },

  getSignatureToken: (token: string): SignatureToken | null => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM signature_tokens WHERE token = ?');
    return stmt.get(token);
  },

  getSignatureTokensForCase: (caseId: string): SignatureToken[] => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM signature_tokens WHERE case_id = ?');
    return stmt.all(caseId);
  },

  updateSignatureToken: (id: string, updates: any): void => {
    ensureServerSide();
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const stmt = db.prepare(`
      UPDATE signature_tokens
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, new Date().toISOString(), id);
  },

  // Case Interaction methods
  createCaseInteraction: (interactionData: any): any => {
    ensureServerSide();
    const id = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO case_interactions (
        id, case_number, source, method, situation, action, outcome, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, interactionData.caseNumber, interactionData.source, interactionData.method,
      interactionData.situation, interactionData.action, interactionData.outcome,
      interactionData.timestamp
    );

    return { id, ...interactionData };
  },

  getCaseInteractions: (caseNumber: string): any[] => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM case_interactions WHERE case_number = ? ORDER BY timestamp DESC');
    return stmt.all(caseNumber);
  },

  updateCaseInteraction: (id: string, updates: any): void => {
    ensureServerSide();
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const stmt = db.prepare(`
      UPDATE case_interactions
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, new Date().toISOString(), id);
  },

  deleteCaseInteraction: (id: string): boolean => {
    ensureServerSide();
    const stmt = db.prepare('DELETE FROM case_interactions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // Digital Signature methods
  createDigitalSignature: (signatureData: any): DigitalSignature => {
    ensureServerSide();
    const id = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO digital_signatures (id, case_id, signature_token_id, signature_data, signer_name, terms_accepted, signed_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, signatureData.case_id, signatureData.signature_token_id, signatureData.signature_data,
             signatureData.signer_name, signatureData.terms_accepted, signatureData.signed_at,
             signatureData.ip_address, signatureData.user_agent);

    return { id, ...signatureData };
  },

  // Bike methods
  getAllBikes: (): Bike[] => {
    ensureServerSide();
    const stmt = db.prepare(`
      SELECT
        id,
        make,
        model,
        COALESCE(image_url, '') as image_url,
        status,
        location,
        assignment,
        created_at,
        updated_at
      FROM bikes
      ORDER BY make, model
    `);
    return stmt.all();
  },

  getBikes: (): BikeFrontend[] => {
    ensureServerSide();
    const stmt = db.prepare(`
      SELECT
        id,
        make,
        model,
        registration,
        registration_expires,
        service_center,
        delivery_street,
        delivery_suburb,
        delivery_state,
        delivery_postcode,
        last_service_date,
        service_notes,
        status,
        location,
        daily_rate,
        image_url,
        image_hint,
        assignment,
        assigned_case_id,
        assignment_start_date,
        assignment_end_date,
        year,
        created_date
      FROM bikes
      ORDER BY make, model
    `);
    const rows = stmt.all();
    return rows.map((row: any) => SchemaTransformers.bikeDbToFrontend(row));
  },

  getBikeById: (id: string): BikeFrontend | null => {
    ensureServerSide();
    const stmt = db.prepare(`
      SELECT
        id,
        make,
        model,
        registration,
        registration_expires,
        service_center,
        delivery_street,
        delivery_suburb,
        delivery_state,
        delivery_postcode,
        last_service_date,
        service_notes,
        status,
        location,
        daily_rate,
        image_url,
        image_hint,
        assignment,
        assigned_case_id,
        assignment_start_date,
        assignment_end_date,
        year,
        created_date
      FROM bikes
      WHERE id = ?
    `);
    const row = stmt.get(id);
    return row ? SchemaTransformers.bikeDbToFrontend(row) : null;
  },

  createBike: (bikeData: Omit<BikeFrontend, 'id'>): BikeFrontend => {
    ensureServerSide();
    const id = `bike_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = db.prepare(`
      INSERT INTO bikes (
        id, make, model, registration, registration_expires, service_center,
        delivery_street, delivery_suburb, delivery_state, delivery_postcode,
        last_service_date, service_notes, status, location, daily_rate,
        image_url, image_hint, assignment, created_date, year
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    stmt.run(
      id, bikeData.make, bikeData.model, bikeData.registration, bikeData.registrationExpires,
      bikeData.serviceCenter, bikeData.deliveryStreet, bikeData.deliverySuburb,
      bikeData.deliveryState, bikeData.deliveryPostcode, bikeData.lastServiceDate,
      bikeData.serviceNotes, bikeData.status, bikeData.location, bikeData.dailyRate,
      bikeData.imageUrl, bikeData.imageHint, bikeData.assignment, now, bikeData.year
    );
    const createdBike = { id, ...bikeData, created_date: now };
    return SchemaTransformers.bikeDbToFrontend(createdBike);
  },

  updateBike: (id: string, updates: any): void => {
    ensureServerSide();
    const stmt = db.prepare(`
      UPDATE bikes
      SET make = ?, model = ?, registration = ?, status = ?, location = ?,
          assignment = ?, image_url = ?, daily_rate = ?, service_notes = ?
      WHERE id = ?
    `);
    stmt.run(
      updates.make, updates.model, updates.registration, updates.status,
      updates.location, updates.assignment, updates.imageUrl, updates.dailyRate,
      updates.serviceNotes, id
    );
  },

  deleteBike: (id: string): void => {
    ensureServerSide();
    const stmt = db.prepare('DELETE FROM bikes WHERE id = ?');
    stmt.run(id);
  },

  bulkInsertBikes: (bikes: any[]): void => {
    ensureServerSide();
    const insertMany = db.transaction((bikes: any[]) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO bikes (
          id, make, model, registration, registration_expires, service_center,
          delivery_street, delivery_suburb, delivery_state, delivery_postcode,
          last_service_date, service_notes, status, location, daily_rate,
          image_url, image_hint, assignment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const bike of bikes) {
        stmt.run(
          bike.id, bike.make, bike.model, bike.registration, bike.registrationExpires,
          bike.serviceCenter, bike.deliveryStreet, bike.deliverySuburb, bike.deliveryState,
          bike.deliveryPostcode, bike.lastServiceDate, bike.serviceNotes, bike.status,
          bike.location, bike.dailyRate, bike.imageUrl, bike.imageHint, bike.assignment
        );
      }
    });

    insertMany(bikes);
    console.log(`✅ Bulk inserted ${bikes.length} bikes`);
  },

  // Case deletion methods
  deleteAllCases: (): number => {
    ensureServerSide();
    const stmt = db.prepare('DELETE FROM cases');
    const result = stmt.run();
    return result.changes;
  },

  deleteSignatureTokensByCase: (caseId: string): number => {
    ensureServerSide();
    const stmt = db.prepare('DELETE FROM signature_tokens WHERE case_id = ?');
    const result = stmt.run(caseId);
    return result.changes;
  },

  deleteDigitalSignaturesByCase: (caseId: string): number => {
    ensureServerSide();
    const stmt = db.prepare('DELETE FROM digital_signatures WHERE case_id = ?');
    const result = stmt.run(caseId);
    return result.changes;
  },

  // Generate unique signature token
  generateSignatureToken: (caseId: string, clientEmail: string, documentType: string, formData: any = {}): string => {
    ensureServerSide();
    const token = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    DatabaseService.createSignatureToken({
      token,
      case_id: caseId,
      client_email: clientEmail,
      document_type: documentType,
      form_data: formData,
      expires_at: expiresAt.toISOString(),
      status: 'pending'
    });

    return token;
  },

  // Get all documents for a case
  getCaseDocuments: (caseId: string): any[] => {
    ensureServerSide();
    const stmt = db.prepare(`
      SELECT
        st.document_type,
        st.pdf_url,
        st.status,
        st.completed_at,
        ds.signer_name,
        ds.signed_at
      FROM signature_tokens st
      LEFT JOIN digital_signatures ds ON st.id = ds.signature_token_id
      WHERE st.case_id = ?
      ORDER BY st.created_at DESC
    `);
    return stmt.all(caseId);
  },

  createRentalAgreement: (agreementData: any): RentalAgreement => {
    ensureServerSide();
    const id = `rental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = db.prepare(`
      INSERT INTO rental_agreements (
        id, case_id, hirer_name, phone, email, address,
        vehicle_details, rental_period, daily_rate, total_cost,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    stmt.run(
      id, agreementData.caseId, agreementData.hirerName, agreementData.phone,
      agreementData.email, agreementData.address, agreementData.vehicleDetails,
      agreementData.rentalPeriod, agreementData.dailyRate, agreementData.totalCost,
      agreementData.status || 'draft', now
    );
    return { id, ...agreementData, created_at: now };
  },

  // Signed Document methods
  createDocument: (docData: any): any => {
    ensureServerSide();
    const stmt = db.prepare(`
      INSERT INTO signed_documents (
        id, case_id, document_type, file_name, file_path, file_size,
        sha256_hash, signed_at, signed_by, signature_data, ip_address,
        user_agent, encryption_key_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      docData.id, docData.caseId, docData.documentType, docData.fileName,
      docData.filePath, docData.fileSize, docData.sha256Hash, docData.signedAt,
      docData.signedBy, docData.signatureData, docData.ipAddress,
      docData.userAgent, docData.encryptionKeyId
    );
    
    return docData;
  },
  
  getDocumentById: (id: string): any => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM signed_documents WHERE id = ?');
    return stmt.get(id);
  },
  
  getDocumentsForCase: (caseId: string): any[] => {
    ensureServerSide();
    const stmt = db.prepare('SELECT * FROM signed_documents WHERE case_id = ? ORDER BY signed_at DESC');
    return stmt.all(caseId);
  },
  
  updateDocument: (id: string, updates: any): void => {
    ensureServerSide();
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const stmt = db.prepare(`
      UPDATE signed_documents 
      SET ${setClause}
      WHERE id = ?
    `);
    
    stmt.run(...Object.values(updates), id);
  },
  
  addDocumentVersion: (id: string, versionData: any): void => {
    ensureServerSide();
    const currentDoc = DatabaseService.getDocumentById(id);
    const versions = currentDoc.versions || [];
    
    versions.push({
      timestamp: new Date().toISOString(),
      modifiedBy: versionData.modifiedBy,
      changes: versionData.changes
    });
    
    DatabaseService.updateDocument(id, { versions });
  },
  
  deleteDocument: (id: string): boolean => {
    ensureServerSide();
    const stmt = db.prepare('DELETE FROM signed_documents WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // Additional methods needed by API routes
  getCaseDetails: async (caseId: string): Promise<CaseFrontend | null> => {
    ensureServerSide();
    return DatabaseService.getCaseById(caseId);
  },

  createDocumentRecord: async (docData: any): Promise<any> => {
    ensureServerSide();
    const newDoc = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...docData,
      uploaded_date: new Date().toISOString()
    };
    return DatabaseService.createDocument(newDoc);
  },

  addDocumentToCase: async (caseId: string, documentId: string): Promise<boolean> => {
    ensureServerSide();
    // For SQLite implementation, this could update a document relationship table
    // For now, we'll just log the association
    console.log(`Document ${documentId} associated with case ${caseId}`);
    return true;
  },

  createAuditLog: async (logData: any): Promise<void> => {
    ensureServerSide();
    const auditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...logData
    };
    // Store audit logs (could be added to a separate table if needed)
    console.log('Audit log created:', auditLog);
  },

  // Additional helper methods for database health checks
  isInitialized: (): boolean => {
    return !!db;
  },

  getTableList: async (): Promise<string[]> => {
    ensureServerSide();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    return tables.map((t: any) => t.name);
  },

  getTableColumns: async (tableName: string): Promise<any[]> => {
    ensureServerSide();
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns;
  },

  rawQuery: async (query: string): Promise<any> => {
    ensureServerSide();
    try {
      const result = db.prepare(query).get();
      return result;
    } catch (error) {
      console.error('Raw query error:', error);
      throw error;
    }
  },
};

// Initialize database when module is imported (server-side only)
let dbInitialized = false;

export function ensureDatabaseInitialized() {
  // Only initialize on server-side
  if (typeof window === 'undefined' && !dbInitialized) {
    try {
      initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
  
  // If called on client-side, throw a helpful error
  if (typeof window !== 'undefined') {
    throw new Error('Database operations must be performed server-side only. Use API routes instead.');
  }
}

export { db };