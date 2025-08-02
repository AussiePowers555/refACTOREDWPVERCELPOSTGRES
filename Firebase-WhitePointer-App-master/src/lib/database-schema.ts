// UNIFIED DATABASE SCHEMA DEFINITIONS - SINGLE SOURCE OF TRUTH
// This file contains all type definitions for the SQLite-based application
// DO NOT create duplicate types in other files - import from here

/**
 * Complete SQLite schema definitions for the Motorbike Rental Management System
 * This is the SINGLE SOURCE OF TRUTH for all type definitions
 * 
 * Architecture: Pure SQLite implementation (no Firebase dependencies)
 */

// Australian states enum
export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

// Case status progression
export type CaseStatus = 
  | 'New Matter'
  | 'Customer Contacted' 
  | 'Awaiting Approval'
  | 'Bike Delivered'
  | 'Bike Returned'
  | 'Demands Sent'
  | 'Awaiting Settlement'
  | 'Settlement Agreed'
  | 'Paid'
  | 'Closed';

// Document types
export type DocumentType = 
  | 'claims' 
  | 'not-at-fault-rental' 
  | 'certis-rental' 
  | 'authority-to-act' 
  | 'direction-to-pay'
  | 'signed-agreement';

// Communication types
export type CommunicationType = 'Email' | 'Phone' | 'SMS' | 'Letter' | 'Meeting' | 'Other';

// Communication priorities
export type CommunicationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Contact types
export type ContactType = 'Client' | 'Lawyer' | 'Insurer' | 'Repairer' | 'Rental Company' | 'Service Center' | 'Other';

// User roles
export type UserRole = 'admin' | 'developer' | 'lawyer' | 'rental_company' | 'workspace_user';

// User account status
export type UserStatus = 'active' | 'pending_password_change' | 'disabled';

/**
 * User Account Entity - For authentication and access control
 */
export interface UserAccount {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  contact_id?: string;
  first_login: boolean;
  remember_login: boolean;
  created_at: string; // ISO string instead of Timestamp
  updated_at: string; // ISO string instead of Timestamp
  last_login?: string; // ISO string instead of Timestamp
}

/**
 * Case Entity - Central entity for each motorbike rental case
 */
export interface Case {
  id: string;
  case_number: string; // Format: WWMM### (Week-Month-Sequence)
  workspace_id?: string;
  status: CaseStatus;
  
  // Not-at-fault (NAF) party details
  naf_name: string;
  naf_phone?: string;
  naf_email?: string;
  naf_address?: string;
  naf_suburb?: string;
  naf_state?: AustralianState;
  naf_postcode?: string;
  naf_dob?: string; // ISO date string
  naf_licence_no?: string;
  naf_licence_state?: AustralianState;
  naf_licence_exp?: string; // ISO date string
  naf_claim_number?: string;
  naf_insurance_company?: string;
  naf_insurer?: string;
  naf_vehicle_rego?: string;
  naf_vehicle_make?: string;
  naf_vehicle_model?: string;
  naf_vehicle_year?: number;
  
  // At-fault (AF) party details
  af_name: string;
  af_phone?: string;
  af_email?: string;
  af_address?: string;
  af_suburb?: string;
  af_state?: AustralianState;
  af_postcode?: string;
  af_claim_number?: string;
  af_insurance_company?: string;
  af_insurer?: string;
  af_vehicle_rego?: string;
  af_vehicle_make?: string;
  af_vehicle_model?: string;
  af_vehicle_year?: number;
  
  // Case assignments
  assigned_lawyer_id?: string;
  assigned_rental_company_id?: string;
  assigned_bike?: string; // Bike registration
  
  // Financial summary (denormalized for quick access)
  invoiced: number;
  reserve: number;
  agreed: number;
  paid: number;
  
  // Accident details
  accident_date?: string; // ISO date string
  accident_time?: string;
  accident_description?: string;
  accident_location?: string;
  accident_diagram?: string; // Base64 encoded image or file path
  
  // Metadata
  created_date: string; // ISO string
  modified_date: string; // ISO string
  
  // Legacy fields for compatibility
  last_updated?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_street_address?: string;
  client_suburb?: string;
  client_state?: string;
  client_postcode?: string;
  client_claim_number?: string;
  client_insurance_company?: string;
  client_insurer?: string;
  client_vehicle_rego?: string;
  at_fault_party_name?: string;
  at_fault_party_phone?: string;
  at_fault_party_email?: string;
  at_fault_party_street_address?: string;
  at_fault_party_suburb?: string;
  at_fault_party_state?: string;
  at_fault_party_postcode?: string;
  at_fault_party_claim_number?: string;
  at_fault_party_insurance_company?: string;
  at_fault_party_insurer?: string;
  at_fault_party_vehicle_rego?: string;
  rental_company?: string;
  lawyer?: string;
}

/**
 * Contact Entity - For lawyers, rental companies, etc.
 */
export interface Contact {
  id: string;
  name: string;
  company?: string;
  type: ContactType;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Workspace Entity - For organizing cases by lawyer/rental company
 */
export interface Workspace {
  id: string;
  name: string;
  contactId: string; // Reference to Contact
  contact_id?: string; // Database field name for compatibility
  type?: string; // Workspace type
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Bike Entity - For fleet management
 */
export interface Bike {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  assigned_case?: string; // Case number if assigned
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  daily_rate?: number;
  created_date: string;
  notes?: string;
}

/**
 * Bike Assignment Entity - Links bikes to cases with rental details
 */
export interface BikeAssignment {
  id: string;
  case_number: string;
  bike_id: string;
  bike_registration?: string; // Denormalized for easy access
  assigned_date: string; // ISO date string
  returned_date?: string; // ISO date string
  daily_rate: number;
  rate_a: number; // Additional rate A
  rate_b: number; // Additional rate B
  helmet_rate?: number;
  apparel_fee?: number;
  admin_fee?: number;
  delivery_fee?: number;
  additional_driver_rate?: number;
  excess_reduction_rate?: number;
  total_cost?: number; // Calculated on return
  created_date: string;
}

/**
 * Financial Record Entity - Detailed financial tracking per case
 */
export interface FinancialRecord {
  id: string;
  case_number: string;
  record_date: string; // ISO date string
  description: string;
  invoiced: number;
  settled: number;
  paid: number;
  outstanding: number; // Calculated field
  notes?: string;
  created_date: string;
}

/**
 * Document Entity - File management for cases
 */
export interface Document {
  id: string;
  case_number: string;
  filename: string;
  file_type: string; // MIME type
  file_size: number;
  file_path: string; // Local file system path
  document_type?: DocumentType;
  description?: string;
  uploaded_by?: string;
  uploaded_date: string;
  is_signed?: boolean;
  signature_date?: string;
}

/**
 * Signed Document Metadata
 */
export interface SignedDocument {
  id: string;
  caseId: string;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  sha256Hash: string;
  signedAt: string;
  signedBy: string;
  signatureData: string; // Base64 encoded signature image
  ipAddress?: string;
  userAgent?: string;
  encryptionKeyId: string;
  versions: {
    timestamp: string;
    modifiedBy: string;
    changes: string;
  }[];
}

/**
 * Digital Signature Entity - For capturing signatures
 */
export interface DigitalSignature {
  id: string;
  case_number: string;
  signature_token_id?: string;
  signature_data: string; // Base64 encoded signature image
  signer_name: string;
  signer_email?: string;
  terms_accepted: boolean;
  signed_at: string; // ISO string
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Signature Token Entity - For secure document signing workflow
 */
export interface SignatureToken {
  id: string;
  token: string; // Secure random token
  case_id: string;
  client_email: string;
  document_type: DocumentType;
  form_data?: string; // JSON string of form data
  form_link?: string;
  status: 'pending' | 'accessed' | 'signed' | 'completed' | 'expired';
  expires_at: string; // ISO string
  signed_at?: string; // ISO string
  completed_at?: string; // ISO string
  jotform_submission_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Rental Agreement Entity - Generated rental agreements
 */
export interface RentalAgreement {
  id: string;
  case_number: string;
  signature_id?: string;
  hirer1_name: string;
  hirer1_email: string;
  hirer1_phone?: string;
  hirer1_address?: string;
  hirer1_licence_no?: string;
  hirer1_licence_state?: AustralianState;
  hirer1_licence_exp?: string;
  hirer1_dob?: string;
  bike_make: string;
  bike_model: string;
  bike_registration: string;
  hire_date: string;
  return_date: string;
  hire_time?: string;
  return_time?: string;
  area_of_use?: string;
  status: 'draft' | 'sent' | 'signed' | 'completed';
  signed_at?: string;
  signed_by?: string;
  pdf_url?: string;
  pdf_path?: string;
  pdf_generated_at?: string;
  created_date: string;
}

/**
 * Commitment Entity - For tracking case commitments and deadlines
 */
export interface Commitment {
  id: string;
  caseNumber: string;
  dueDate: string; // ISO date string
  note: string;
  status: 'Open' | 'Closed';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Communication Log Entity - Track all communications
 */
export interface CommunicationLog {
  id: string;
  case_number: string;
  communication_date: string;
  log_type: CommunicationType;
  direction: 'inbound' | 'outbound';
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  subject?: string;
  message: string;
  priority: CommunicationPriority;
  follow_up_required: boolean;
  follow_up_date?: string;
  created_by?: string;
  created_date: string;
}

/**
 * Insurance Entity - Insurance company details
 */
export interface Insurance {
  id: string;
  case_number: string;
  company_name: string;
  policy_number?: string;
  claim_number?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  created_date: string;
}

/**
 * Collections Client Entity - For debt collection management
 */
export interface CollectionsClient {
  id: string;
  case_number: string;
  collections_company: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  assigned_date: string;
  outstanding_amount: number;
  commission_rate?: number;
  status: 'assigned' | 'in_progress' | 'resolved' | 'closed';
  notes?: string;
  is_active: boolean;
  created_date: string;
}

/**
 * Followup Note Entity - Scheduled follow-ups and reminders
 */
export interface FollowupNote {
  id: string;
  case_number: string;
  followup_date: string;
  followup_type: 'call' | 'email' | 'letter' | 'meeting' | 'other';
  description: string;
  priority: CommunicationPriority;
  assigned_to?: string;
  completed: boolean;
  completed_date?: string;
  created_by?: string;
  created_date: string;
  modified_date: string;
}

/**
 * SQLite Table Names - For consistency
 */
export const COLLECTIONS = {
  CASES: 'cases',
  BIKES: 'bikes',
  BIKE_ASSIGNMENTS: 'bike_assignments',
  FINANCIAL_RECORDS: 'financial_records',
  DOCUMENTS: 'documents',
  DIGITAL_SIGNATURES: 'digital_signatures',
  SIGNATURE_TOKENS: 'signature_tokens',
  RENTAL_AGREEMENTS: 'rental_agreements',
  COMMUNICATION_LOGS: 'communication_logs',
  INSURANCE_COMPANIES: 'insurance_companies',
  COLLECTIONS_CLIENTS: 'collections_clients',
  FOLLOWUP_NOTES: 'followup_notes',
  CONTACTS: 'contacts',
  WORKSPACES: 'workspaces',
  USER_ACCOUNTS: 'user_accounts',
  SIGNED_DOCUMENTS: 'signed_documents'
} as const;

/**
 * Validation Helpers
 */
export class ValidationHelpers {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  static isValidPostcode(postcode: string, state?: AustralianState): boolean {
    const postcodeRegex = /^\d{4}$/;
    return postcodeRegex.test(postcode);
  }

  static isValidRegistration(registration: string): boolean {
    // Australian registration format varies by state
    const regRegex = /^[A-Z0-9]{3,6}$/i;
    return regRegex.test(registration);
  }

  static isValidCaseNumber(caseNumber: string): boolean {
    const caseRegex = /^\d{5}$/; // WWMM###
    return caseRegex.test(caseNumber);
  }

  static generateCaseNumber(week: number, month: number, sequence: number): string {
    return `${week.toString().padStart(2, '0')}${month.toString().padStart(2, '0')}${sequence.toString().padStart(3, '0')}`;
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  }

  static formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-AU');
  }

  static formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-AU');
  }
}

/**
 * Constants for business logic
 */
export const BUSINESS_CONSTANTS = {
  DEFAULT_RENTAL_PERIOD_DAYS: 7,
  DEFAULT_ADMIN_FEE: 95,
  GST_RATE: 0.1,
  DEFAULT_TOKEN_EXPIRY_HOURS: 72,
  MAX_FILE_SIZE_MB: 10,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  SUPPORTED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
} as const;

/**
 * FRONTEND-FRIENDLY INTERFACES
 * These interfaces provide camelCase versions for frontend components
 * They map directly to the database schema above
 */

// Frontend-friendly Case interface (maps to Case above)
export interface CaseFrontend {
  id: string;
  caseNumber: string;
  workspaceId?: string;
  status: CaseStatus;
  lastUpdated: string;

  // Client (Not-at-fault) details - camelCase for frontend
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientStreetAddress?: string;
  clientSuburb?: string;
  clientState?: string;
  clientPostcode?: string;
  clientClaimNumber?: string;
  clientInsuranceCompany?: string;
  clientInsurer?: string;
  clientVehicleRego?: string;

  // At-fault party details - camelCase for frontend
  atFaultPartyName: string;
  atFaultPartyPhone?: string;
  atFaultPartyEmail?: string;
  atFaultPartyStreetAddress?: string;
  atFaultPartySuburb?: string;
  atFaultPartyState?: string;
  atFaultPartyPostcode?: string;
  atFaultPartyClaimNumber?: string;
  atFaultPartyInsuranceCompany?: string;
  atFaultPartyInsurer?: string;
  atFaultPartyVehicleRego?: string;

  // Assignments and financial data
  assigned_lawyer_id?: string;
  assigned_rental_company_id?: string;
  invoiced?: number;
  reserve?: number;
  agreed?: number;
  paid?: number;

  // Accident details
  accidentDate?: string;
  accidentTime?: string;
  accidentDescription?: string;
  accidentDiagram?: string;
}

// Frontend-friendly Contact interface
export interface ContactFrontend {
  id: string;
  name: string;
  company?: string;
  type: ContactType;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Frontend-friendly Workspace interface
export interface WorkspaceFrontend {
  id: string;
  name: string;
  contactId: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Frontend-friendly Bike interface
export interface BikeFrontend {
  id: string;
  make: string;
  model: string;
  registration?: string;
  registrationExpires?: string;
  serviceCenter?: string;
  serviceCenterContactId?: string;
  deliveryStreet?: string;
  deliverySuburb?: string;
  deliveryState?: string;
  deliveryPostcode?: string;
  lastServiceDate?: string;
  serviceNotes?: string;
  status: "available" | "assigned" | "maintenance" | "retired";
  location?: string;
  dailyRate?: number;
  dailyRateA?: number;
  dailyRateB?: number;
  imageUrl?: string;
  imageHint?: string;
  assignment?: string;
  assignedCaseId?: string;
  assignmentStartDate?: string;
  assignmentEndDate?: string;
  year?: number;
  createdDate?: string;
}

/**
 * DATA TRANSFORMATION FUNCTIONS
 * These functions convert between database schema and frontend interfaces
 */

export class SchemaTransformers {
  // Convert database Case to frontend CaseFrontend
  static caseDbToFrontend(dbCase: Case): CaseFrontend {
    return {
      id: dbCase.id,
      caseNumber: dbCase.case_number,
      workspaceId: dbCase.workspace_id,
      status: dbCase.status,
      lastUpdated: dbCase.last_updated || dbCase.created_date,

      // Client (NAF) details
      clientName: dbCase.naf_name,
      clientPhone: dbCase.naf_phone,
      clientEmail: dbCase.naf_email,
      clientStreetAddress: dbCase.naf_address,
      clientSuburb: dbCase.naf_suburb,
      clientState: dbCase.naf_state,
      clientPostcode: dbCase.naf_postcode,
      clientClaimNumber: dbCase.naf_claim_number,
      clientInsuranceCompany: dbCase.naf_insurance_company,
      clientInsurer: dbCase.naf_insurer,
      clientVehicleRego: dbCase.naf_vehicle_rego,

      // At-fault party details
      atFaultPartyName: dbCase.af_name,
      atFaultPartyPhone: dbCase.af_phone,
      atFaultPartyEmail: dbCase.af_email,
      atFaultPartyStreetAddress: dbCase.af_address,
      atFaultPartySuburb: dbCase.af_suburb,
      atFaultPartyState: dbCase.af_state,
      atFaultPartyPostcode: dbCase.af_postcode,
      atFaultPartyClaimNumber: dbCase.af_claim_number,
      atFaultPartyInsuranceCompany: dbCase.af_insurance_company,
      atFaultPartyInsurer: dbCase.af_insurer,
      atFaultPartyVehicleRego: dbCase.af_vehicle_rego,

      // Assignments and financial
      assigned_lawyer_id: dbCase.assigned_lawyer_id,
      assigned_rental_company_id: dbCase.assigned_rental_company_id,
      invoiced: dbCase.invoiced,
      reserve: dbCase.reserve,
      agreed: dbCase.agreed,
      paid: dbCase.paid,

      // Accident details
      accidentDate: dbCase.accident_date,
      accidentTime: dbCase.accident_time,
      accidentDescription: dbCase.accident_description,
      accidentDiagram: dbCase.accident_diagram
    };
  }

  // Convert frontend CaseFrontend to database Case
  static caseFrontendToDb(frontendCase: CaseFrontend): Partial<Case> {
    return {
      id: frontendCase.id,
      case_number: frontendCase.caseNumber,
      workspace_id: frontendCase.workspaceId,
      status: frontendCase.status,
      last_updated: frontendCase.lastUpdated,

      // Client (NAF) details
      naf_name: frontendCase.clientName,
      naf_phone: frontendCase.clientPhone,
      naf_email: frontendCase.clientEmail,
      naf_address: frontendCase.clientStreetAddress,
      naf_suburb: frontendCase.clientSuburb,
      naf_state: frontendCase.clientState as AustralianState,
      naf_postcode: frontendCase.clientPostcode,
      naf_claim_number: frontendCase.clientClaimNumber,
      naf_insurance_company: frontendCase.clientInsuranceCompany,
      naf_insurer: frontendCase.clientInsurer,
      naf_vehicle_rego: frontendCase.clientVehicleRego,

      // At-fault party details
      af_name: frontendCase.atFaultPartyName,
      af_phone: frontendCase.atFaultPartyPhone,
      af_email: frontendCase.atFaultPartyEmail,
      af_address: frontendCase.atFaultPartyStreetAddress,
      af_suburb: frontendCase.atFaultPartySuburb,
      af_state: frontendCase.atFaultPartyState as AustralianState,
      af_postcode: frontendCase.atFaultPartyPostcode,
      af_claim_number: frontendCase.atFaultPartyClaimNumber,
      af_insurance_company: frontendCase.atFaultPartyInsuranceCompany,
      af_insurer: frontendCase.atFaultPartyInsurer,
      af_vehicle_rego: frontendCase.atFaultPartyVehicleRego,

      // Assignments and financial
      assigned_lawyer_id: frontendCase.assigned_lawyer_id,
      assigned_rental_company_id: frontendCase.assigned_rental_company_id,
      invoiced: frontendCase.invoiced || 0,
      reserve: frontendCase.reserve || 0,
      agreed: frontendCase.agreed || 0,
      paid: frontendCase.paid || 0,

      // Accident details
      accident_date: frontendCase.accidentDate,
      accident_time: frontendCase.accidentTime,
      accident_description: frontendCase.accidentDescription,
      accident_diagram: frontendCase.accidentDiagram
    };
  }

  // Convert database Contact to frontend ContactFrontend
  static contactDbToFrontend(dbContact: Contact): ContactFrontend {
    return {
      id: dbContact.id,
      name: dbContact.name,
      company: dbContact.company,
      type: dbContact.type,
      phone: dbContact.phone,
      email: dbContact.email,
      address: dbContact.address,
      createdAt: dbContact.created_at,
      updatedAt: dbContact.updated_at
    };
  }

  // Convert database Workspace to frontend WorkspaceFrontend
  static workspaceDbToFrontend(dbWorkspace: Workspace): WorkspaceFrontend {
    return {
      id: dbWorkspace.id,
      name: dbWorkspace.name,
      contactId: dbWorkspace.contact_id || '',
      type: dbWorkspace.type,
      createdAt: dbWorkspace.created_at,
      updatedAt: dbWorkspace.updated_at
    };
  }

  // Convert database Bike to frontend BikeFrontend
  static bikeDbToFrontend(dbBike: any): BikeFrontend {
    return {
      id: dbBike.id,
      make: dbBike.make,
      model: dbBike.model,
      registration: dbBike.registration,
      registrationExpires: dbBike.registration_expires,
      serviceCenter: dbBike.service_center,
      serviceCenterContactId: dbBike.service_center_contact_id,
      deliveryStreet: dbBike.delivery_street,
      deliverySuburb: dbBike.delivery_suburb,
      deliveryState: dbBike.delivery_state,
      deliveryPostcode: dbBike.delivery_postcode,
      lastServiceDate: dbBike.last_service_date,
      serviceNotes: dbBike.service_notes,
      status: dbBike.status,
      location: dbBike.location,
      dailyRate: dbBike.daily_rate,
      dailyRateA: dbBike.daily_rate_a,
      dailyRateB: dbBike.daily_rate_b,
      imageUrl: dbBike.image_url,
      imageHint: dbBike.image_hint,
      assignment: dbBike.assignment,
      assignedCaseId: dbBike.assigned_case_id,
      assignmentStartDate: dbBike.assignment_start_date,
      assignmentEndDate: dbBike.assignment_end_date,
      year: dbBike.year,
      createdDate: dbBike.created_date
    };
  }
}

/**
 * Document type configurations
 */
export const DOCUMENT_TYPES = {
  'claims': {
    name: 'Claims Form',
    description: 'Submit your insurance claim details',
    jotform_id: '232543267390861'
  },
  'not-at-fault-rental': {
    name: 'Not At Fault Rental',
    description: 'Rental agreement for not-at-fault parties',
    jotform_id: '233241680987464'
  },
  'certis-rental': {
    name: 'Certis Rental',
    description: 'Certis rental agreement form',
    jotform_id: '233238940095055'
  },
  'authority-to-act': {
    name: 'Authority to Act',
    description: 'Authorization for legal representation',
    jotform_id: '233183619631457'
  },
  'direction-to-pay': {
    name: 'Direction to Pay',
    description: 'Payment direction authorization',
    jotform_id: '233061493503046'
  },
  'signed-agreement': {
    name: 'Signed Agreement',
    description: 'Signed agreement document',
    jotform_id: ''
  }
} as const;

// Mock Timestamp object for backward compatibility with Firebase code
export const Timestamp = {
  now: () => new Date().toISOString(),
  fromDate: (date: Date) => date.toISOString(),
  fromMillis: (millis: number) => new Date(millis).toISOString(),
  toDate: (isoString: string) => new Date(isoString),
  toMillis: (isoString: string) => new Date(isoString).getTime()
};

// Mock FieldValue for backward compatibility
export const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
  delete: () => null,
  increment: (n: number) => n,
  arrayUnion: (...elements: any[]) => elements,
  arrayRemove: (...elements: any[]) => elements
};

console.log('📦 Using SQLite-compatible schema layer');