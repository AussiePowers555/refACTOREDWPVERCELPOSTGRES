// Vercel PostgreSQL database implementation
import { sql } from '@vercel/postgres';
import type {
  Case,
  Contact,
  Workspace,
  UserAccount,
  CaseFrontend,
  ContactFrontend,
  WorkspaceFrontend,
  BikeFrontend,
  SignatureToken,
  DigitalSignature,
  RentalAgreement,
  Bike
} from './database-schema';
import { SchemaTransformers } from './database-schema';

let isInitialized = false;

// Initialize database with tables
export async function initializeDatabase() {
  if (isInitialized) {
    console.log('✅ Database already initialized');
    return;
  }

  try {
    console.log('🔧 Initializing PostgreSQL database...');
    
    await createTables();
    await seedInitialData();
    
    isInitialized = true;
    console.log('✅ PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  console.log('🔧 Creating database tables...');

  // Cases table
  await sql`
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
      invoiced DECIMAL DEFAULT 0,
      reserve DECIMAL DEFAULT 0,
      agreed DECIMAL DEFAULT 0,
      paid DECIMAL DEFAULT 0,
      accident_date TEXT,
      accident_time TEXT,
      accident_description TEXT,
      accident_diagram TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Contacts table
  await sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      type TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Workspaces table
  await sql`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  console.log('✅ Database tables created');
}

async function seedInitialData() {
  console.log('🌱 Checking for existing data...');
  
  // Check if contacts exist
  const contactCount = await sql`SELECT COUNT(*) as count FROM contacts`;
  const caseCount = await sql`SELECT COUNT(*) as count FROM cases`;
  
  if (contactCount.rows[0].count > 0 && caseCount.rows[0].count > 0) {
    console.log('📊 Database already has data, skipping seed');
    return;
  }

  console.log('🌱 Seeding initial data...');
  
  if (contactCount.rows[0].count === 0) {
    await seedContacts();
  }
  
  const workspaceCount = await sql`SELECT COUNT(*) as count FROM workspaces`;
  if (workspaceCount.rows[0].count === 0) {
    await seedWorkspaces();
  }
  
  if (caseCount.rows[0].count === 0) {
    await seedCases();
  }
}

async function seedContacts() {
  console.log('🌱 Seeding contacts...');
  
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
    }
  ];

  for (const contact of initialContacts) {
    await sql`
      INSERT INTO contacts (id, name, company, type, phone, email, address)
      VALUES (${contact.id}, ${contact.name}, ${contact.company}, ${contact.type}, ${contact.phone}, ${contact.email}, ${contact.address})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  
  console.log('✅ Initial contacts seeded');
}

async function seedWorkspaces() {
  console.log('🌱 Seeding workspaces...');
  
  await sql`
    INSERT INTO workspaces (id, name, contact_id)
    VALUES ('workspace-david-001', 'David - Not At Fault Workspace', 'contact-david-001')
    ON CONFLICT (id) DO NOTHING
  `;
  
  console.log('✅ Initial workspaces seeded');
}

async function seedCases() {
  console.log('🌱 Seeding cases...');
  
  const initialCases = [
    {
      id: "case-001",
      caseNumber: "2025-001",
      status: "Invoiced",
      clientName: "John Smith",
      clientPhone: "555-1111",
      clientEmail: "john.s@example.com",
      atFaultPartyName: "Jane Doe",
      invoiced: 5500,
      reserve: 5000,
      agreed: 5000,
      paid: 2500
    },
    {
      id: "case-002", 
      caseNumber: "2025-002",
      status: "Active",
      clientName: "Sarah Johnson",
      clientPhone: "555-3333",
      clientEmail: "sarah.j@example.com",
      atFaultPartyName: "Mike Brown",
      invoiced: 3200,
      reserve: 3000,
      agreed: 3000,
      paid: 0
    }
  ];

  for (const caseData of initialCases) {
    await sql`
      INSERT INTO cases (
        id, case_number, status, last_updated, client_name, client_phone, client_email,
        at_fault_party_name, invoiced, reserve, agreed, paid
      ) VALUES (
        ${caseData.id}, ${caseData.caseNumber}, ${caseData.status}, NOW(),
        ${caseData.clientName}, ${caseData.clientPhone}, ${caseData.clientEmail},
        ${caseData.atFaultPartyName}, ${caseData.invoiced}, ${caseData.reserve}, 
        ${caseData.agreed}, ${caseData.paid}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log('✅ Initial cases seeded');
}

// Helper function to map database row to Case interface
function mapDbRowToCase(row: any): Case {
  return {
    id: row.id,
    case_number: row.case_number,
    workspace_id: row.workspace_id,
    status: row.status,
    last_updated: row.last_updated,
    naf_name: row.client_name,
    naf_phone: row.client_phone,
    naf_email: row.client_email,
    naf_address: row.client_street_address,
    naf_suburb: row.client_suburb,
    naf_state: row.client_state,
    naf_postcode: row.client_postcode,
    naf_claim_number: row.client_claim_number,
    naf_insurance_company: row.client_insurance_company,
    naf_insurer: row.client_insurer,
    naf_vehicle_rego: row.client_vehicle_rego,
    af_name: row.at_fault_party_name,
    af_phone: row.at_fault_party_phone,
    af_email: row.at_fault_party_email,
    af_address: row.at_fault_party_street_address,
    af_suburb: row.at_fault_party_suburb,
    af_state: row.at_fault_party_state,
    af_postcode: row.at_fault_party_postcode,
    af_claim_number: row.at_fault_party_claim_number,
    af_insurance_company: row.at_fault_party_insurance_company,
    af_insurer: row.at_fault_party_insurer,
    af_vehicle_rego: row.at_fault_party_vehicle_rego,
    assigned_lawyer_id: row.assigned_lawyer_id,
    assigned_rental_company_id: row.assigned_rental_company_id,
    invoiced: row.invoiced || 0,
    reserve: row.reserve || 0,
    agreed: row.agreed || 0,
    paid: row.paid || 0,
    accident_date: row.accident_date,
    accident_time: row.accident_time,
    accident_description: row.accident_description,
    accident_diagram: row.accident_diagram,
    created_date: row.created_at?.toISOString() || new Date().toISOString(),
    modified_date: row.updated_at?.toISOString() || new Date().toISOString()
  };
}

function mapDbRowToCaseFrontend(row: any): CaseFrontend {
  const dbCase = mapDbRowToCase(row);
  return SchemaTransformers.caseDbToFrontend(dbCase);
}

// PostgreSQL DatabaseService implementation
export const DatabaseService = {
  // Case methods
  createCase: async (caseData: any): Promise<any> => {
    const id = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await sql`
      INSERT INTO cases (
        id, case_number, status, last_updated, client_name, client_email, client_phone,
        client_street_address, client_suburb, client_state, client_postcode,
        client_claim_number, client_insurance_company, client_insurer,
        at_fault_party_name, at_fault_party_email, at_fault_party_phone,
        at_fault_party_street_address, at_fault_party_suburb, at_fault_party_state, at_fault_party_postcode,
        at_fault_party_claim_number, at_fault_party_insurance_company, at_fault_party_insurer,
        rental_company, lawyer, invoiced, reserve, agreed, paid, workspace_id
      ) VALUES (
        ${id}, ${caseData.caseNumber || caseData.case_number}, ${caseData.status || 'Active'}, NOW(),
        ${caseData.clientName || caseData.client_name}, ${caseData.clientEmail || caseData.client_email}, ${caseData.clientPhone || caseData.client_phone},
        ${caseData.clientStreetAddress || caseData.client_street_address}, ${caseData.clientSuburb || caseData.client_suburb}, ${caseData.clientState || caseData.client_state}, ${caseData.clientPostcode || caseData.client_postcode},
        ${caseData.clientClaimNumber || caseData.client_claim_number}, ${caseData.clientInsuranceCompany || caseData.client_insurance_company}, ${caseData.clientInsurer || caseData.client_insurer},
        ${caseData.atFaultPartyName || caseData.at_fault_party_name}, ${caseData.atFaultPartyEmail || caseData.at_fault_party_email}, ${caseData.atFaultPartyPhone || caseData.at_fault_party_phone},
        ${caseData.atFaultPartyStreetAddress || caseData.at_fault_party_street_address}, ${caseData.atFaultPartySuburb || caseData.at_fault_party_suburb}, ${caseData.atFaultPartyState || caseData.at_fault_party_state}, ${caseData.atFaultPartyPostcode || caseData.at_fault_party_postcode},
        ${caseData.atFaultPartyClaimNumber || caseData.at_fault_party_claim_number}, ${caseData.atFaultPartyInsuranceCompany || caseData.at_fault_party_insurance_company}, ${caseData.atFaultPartyInsurer || caseData.at_fault_party_insurer},
        ${caseData.rentalCompany || caseData.rental_company}, ${caseData.lawyer}, ${caseData.invoiced || 0}, ${caseData.reserve || 0}, ${caseData.agreed || 0}, ${caseData.paid || 0}, ${caseData.workspaceId || caseData.workspace_id}
      )
    `;

    return { id, ...caseData };
  },

  getAllCases: async (): Promise<CaseFrontend[]> => {
    const result = await sql`SELECT * FROM cases ORDER BY last_updated DESC`;
    return result.rows.map(mapDbRowToCaseFrontend);
  },

  getCaseById: async (id: string): Promise<CaseFrontend | null> => {
    const result = await sql`SELECT * FROM cases WHERE id = ${id}`;
    return result.rows.length > 0 ? mapDbRowToCaseFrontend(result.rows[0]) : null;
  },

  getCaseByCaseNumber: async (caseNumber: string): Promise<CaseFrontend | null> => {
    const result = await sql`SELECT * FROM cases WHERE case_number = ${caseNumber}`;
    return result.rows.length > 0 ? mapDbRowToCaseFrontend(result.rows[0]) : null;
  },

  updateCase: async (id: string, updates: any): Promise<void> => {
    // For simplicity, just update the status and last_updated for now
    await sql`
      UPDATE cases 
      SET status = ${updates.status || 'Active'}, last_updated = NOW(), updated_at = NOW()
      WHERE id = ${id}
    `;
  },

  deleteCase: async (id: string): Promise<boolean> => {
    const result = await sql`DELETE FROM cases WHERE id = ${id}`;
    return result.rowCount > 0;
  },

  // Contact methods
  getAllContacts: async (): Promise<ContactFrontend[]> => {
    const result = await sql`SELECT * FROM contacts ORDER BY name`;
    return result.rows.map(SchemaTransformers.contactDbToFrontend);
  },

  createContact: async (contactData: any): Promise<Contact> => {
    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await sql`
      INSERT INTO contacts (id, name, company, type, phone, email, address)
      VALUES (${id}, ${contactData.name}, ${contactData.company}, ${contactData.type}, 
              ${contactData.phone}, ${contactData.email}, ${contactData.address})
    `;

    return { id, ...contactData };
  },

  // Workspace methods
  getAllWorkspaces: async (): Promise<WorkspaceFrontend[]> => {
    const result = await sql`SELECT * FROM workspaces ORDER BY name`;
    return result.rows.map(SchemaTransformers.workspaceDbToFrontend);
  },

  createWorkspace: async (workspaceData: any): Promise<Workspace> => {
    const id = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await sql`
      INSERT INTO workspaces (id, name, contact_id, type)
      VALUES (${id}, ${workspaceData.name}, ${workspaceData.contact_id}, ${workspaceData.type})
    `;

    return { id, ...workspaceData };
  },

  updateWorkspace: async (id: string, updates: any): Promise<void> => {
    await sql`
      UPDATE workspaces
      SET name = ${updates.name}, contact_id = ${updates.contact_id}, type = ${updates.type}, updated_at = NOW()
      WHERE id = ${id}
    `;
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    await sql`DELETE FROM workspaces WHERE id = ${id}`;
  },

  // Ensure database is initialized
  ensureInitialized: async (): Promise<void> => {
    if (!isInitialized) {
      await initializeDatabase();
    }
  }
};

// Ensure database is initialized on import
export async function ensureDatabaseInitialized() {
  if (!isInitialized) {
    await initializeDatabase();
  }
}