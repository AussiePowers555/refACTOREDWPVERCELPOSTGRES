/**
 * PostgreSQL Database Schema - Drizzle ORM Implementation
 * Complete schema for WhitePointer Motorcycle Rental Management System
 * 
 * This file defines the PostgreSQL schema using Drizzle ORM
 * Migrated from SQLite to PostgreSQL for production deployment
 */

import { 
  pgTable, 
  text, 
  integer, 
  decimal, 
  timestamp, 
  boolean, 
  jsonb, 
  index,
  foreignKey,
  unique,
  serial,
  date,
  time
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ===== CORE TABLES =====

/**
 * Contacts Table - Lawyers, rental companies, service centers, etc.
 */
export const contacts = pgTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company'),
  type: text('type').notNull(), // 'Client' | 'Lawyer' | 'Insurer' | 'Repairer' | 'Rental Company' | 'Service Center' | 'Other'
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  nameIdx: index('idx_contacts_name').on(table.name),
  typeIdx: index('idx_contacts_type').on(table.type),
  emailIdx: index('idx_contacts_email').on(table.email),
}));

/**
 * Workspaces Table - For organizing cases by lawyer/rental company
 */
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  contactId: text('contact_id').notNull(),
  type: text('type'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  contactRef: foreignKey({
    columns: [table.contactId],
    foreignColumns: [contacts.id],
    name: 'fk_workspace_contact'
  }),
  nameIdx: index('idx_workspaces_name').on(table.name),
  contactIdx: index('idx_workspaces_contact').on(table.contactId),
}));

/**
 * Cases Table - Central entity for each motorbike rental case
 */
export const cases = pgTable('cases', {
  id: text('id').primaryKey(),
  caseNumber: text('case_number').notNull().unique(),
  workspaceId: text('workspace_id'),
  status: text('status').notNull().default('New Matter'),
  
  // NAF (Not-At-Fault) Party Details - stored as JSONB for flexibility
  nafData: jsonb('naf_data').notNull().$type<{
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    dob?: string;
    licenceNo?: string;
    licenceState?: string;
    licenceExp?: string;
    claimNumber?: string;
    insuranceCompany?: string;
    insurer?: string;
    vehicleRego?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
  }>(),
  
  // AF (At-Fault) Party Details - stored as JSONB for flexibility  
  afData: jsonb('af_data').notNull().$type<{
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    claimNumber?: string;
    insuranceCompany?: string;
    insurer?: string;
    vehicleRego?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
  }>(),
  
  // Assignments
  assignedLawyerId: text('assigned_lawyer_id'),
  assignedRentalCompanyId: text('assigned_rental_company_id'),
  assignedBike: text('assigned_bike'),
  
  // Financial Summary (optimized for quick calculations)
  financialSummary: jsonb('financial_summary').default({
    invoiced: 0,
    reserve: 0,
    agreed: 0,
    paid: 0
  }).$type<{
    invoiced: number;
    reserve: number;
    agreed: number;
    paid: number;
  }>(),
  
  // Accident Details
  accidentDate: date('accident_date'),
  accidentTime: time('accident_time'),
  accidentDescription: text('accident_description'),
  accidentLocation: text('accident_location'),
  accidentDiagram: text('accident_diagram'), // Base64 or file path
  
  // Metadata
  createdDate: timestamp('created_date', { withTimezone: true }).defaultNow(),
  modifiedDate: timestamp('modified_date', { withTimezone: true }).defaultNow(),
  
  // Legacy fields for backward compatibility
  lastUpdated: text('last_updated'),
  clientName: text('client_name'),
  clientPhone: text('client_phone'),
  clientEmail: text('client_email'),
  clientStreetAddress: text('client_street_address'),
  clientSuburb: text('client_suburb'),
  clientState: text('client_state'),
  clientPostcode: text('client_postcode'),
  clientClaimNumber: text('client_claim_number'),
  clientInsuranceCompany: text('client_insurance_company'),
  clientInsurer: text('client_insurer'),
  clientVehicleRego: text('client_vehicle_rego'),
  atFaultPartyName: text('at_fault_party_name'),
  atFaultPartyPhone: text('at_fault_party_phone'),
  atFaultPartyEmail: text('at_fault_party_email'),
  atFaultPartyStreetAddress: text('at_fault_party_street_address'),
  atFaultPartySuburb: text('at_fault_party_suburb'),
  atFaultPartyState: text('at_fault_party_state'),
  atFaultPartyPostcode: text('at_fault_party_postcode'),
  atFaultPartyClaimNumber: text('at_fault_party_claim_number'),
  atFaultPartyInsuranceCompany: text('at_fault_party_insurance_company'),
  atFaultPartyInsurer: text('at_fault_party_insurer'),
  atFaultPartyVehicleRego: text('at_fault_party_vehicle_rego'),
  rentalCompany: text('rental_company'),
  lawyer: text('lawyer'),
  invoiced: decimal('invoiced', { precision: 10, scale: 2 }).default('0'),
  reserve: decimal('reserve', { precision: 10, scale: 2 }).default('0'),  
  agreed: decimal('agreed', { precision: 10, scale: 2 }).default('0'),
  paid: decimal('paid', { precision: 10, scale: 2 }).default('0'),
}, (table) => ({
  workspaceRef: foreignKey({
    columns: [table.workspaceId],
    foreignColumns: [workspaces.id],
    name: 'fk_case_workspace'
  }),
  lawyerRef: foreignKey({
    columns: [table.assignedLawyerId],
    foreignColumns: [contacts.id],
    name: 'fk_case_lawyer'
  }),
  rentalCompanyRef: foreignKey({
    columns: [table.assignedRentalCompanyId],
    foreignColumns: [contacts.id],
    name: 'fk_case_rental_company'
  }),
  
  // Performance indexes
  caseNumberIdx: index('idx_cases_case_number').on(table.caseNumber),
  statusIdx: index('idx_cases_status').on(table.status),
  modifiedDateIdx: index('idx_cases_modified_date').on(table.modifiedDate),
  workspaceIdx: index('idx_cases_workspace').on(table.workspaceId),
  
  // GIN indexes for JSONB columns
  nafDataIdx: index('idx_cases_naf_data').using('gin', table.nafData),
  afDataIdx: index('idx_cases_af_data').using('gin', table.afData),
  financialIdx: index('idx_cases_financial').using('gin', table.financialSummary),
  
  // Composite indexes for common queries
  statusModifiedIdx: index('idx_cases_status_modified').on(table.status, table.modifiedDate),
}));

/**
 * Bikes Table - Fleet management
 */
export const bikes = pgTable('bikes', {
  id: text('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  registration: text('registration'),
  registrationExpires: date('registration_expires'),
  serviceCenter: text('service_center'),
  serviceCenterContactId: text('service_center_contact_id'),
  deliveryStreet: text('delivery_street'),
  deliverySuburb: text('delivery_suburb'),
  deliveryState: text('delivery_state'),
  deliveryPostcode: text('delivery_postcode'),
  lastServiceDate: date('last_service_date'),
  serviceNotes: text('service_notes'),
  status: text('status').notNull().default('available'), // 'available' | 'assigned' | 'maintenance' | 'retired'
  location: text('location').default('Main Warehouse'),
  dailyRate: decimal('daily_rate', { precision: 8, scale: 2 }).default('85.00'),
  dailyRateA: decimal('daily_rate_a', { precision: 8, scale: 2 }),
  dailyRateB: decimal('daily_rate_b', { precision: 8, scale: 2 }),
  imageUrl: text('image_url'),
  imageHint: text('image_hint'),
  assignment: text('assignment').default('-'),
  assignedCaseId: text('assigned_case_id'),
  assignmentStartDate: date('assignment_start_date'),
  assignmentEndDate: date('assignment_end_date'),
  year: integer('year'),
  createdDate: timestamp('created_date', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  serviceCenterRef: foreignKey({
    columns: [table.serviceCenterContactId],
    foreignColumns: [contacts.id],
    name: 'fk_bike_service_center'
  }),
  assignedCaseRef: foreignKey({
    columns: [table.assignedCaseId],
    foreignColumns: [cases.id],
    name: 'fk_bike_assigned_case'
  }),
  makeModelIdx: index('idx_bikes_make_model').on(table.make, table.model),
  statusIdx: index('idx_bikes_status').on(table.status),
  registrationIdx: index('idx_bikes_registration').on(table.registration),
  assignedCaseIdx: index('idx_bikes_assigned_case').on(table.assignedCaseId),
}));

/**
 * Bike Assignments Table - Links bikes to cases with rental details
 */
export const bikeAssignments = pgTable('bike_assignments', {
  id: text('id').primaryKey(),
  caseNumber: text('case_number').notNull(),
  bikeId: text('bike_id').notNull(),
  bikeRegistration: text('bike_registration'), // Denormalized for easy access
  assignedDate: date('assigned_date').notNull(),
  returnedDate: date('returned_date'),
  dailyRate: decimal('daily_rate', { precision: 8, scale: 2 }).notNull(),
  rateA: decimal('rate_a', { precision: 8, scale: 2 }).notNull(),
  rateB: decimal('rate_b', { precision: 8, scale: 2 }).notNull(),
  helmetRate: decimal('helmet_rate', { precision: 8, scale: 2 }),
  apparelFee: decimal('apparel_fee', { precision: 8, scale: 2 }),
  adminFee: decimal('admin_fee', { precision: 8, scale: 2 }),
  deliveryFee: decimal('delivery_fee', { precision: 8, scale: 2 }),
  additionalDriverRate: decimal('additional_driver_rate', { precision: 8, scale: 2 }),
  excessReductionRate: decimal('excess_reduction_rate', { precision: 8, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }), // Calculated on return
  createdDate: timestamp('created_date', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseNumber],
    foreignColumns: [cases.caseNumber],
    name: 'fk_assignment_case'
  }),
  bikeRef: foreignKey({
    columns: [table.bikeId],
    foreignColumns: [bikes.id],
    name: 'fk_assignment_bike'
  }),
  caseNumberIdx: index('idx_assignments_case_number').on(table.caseNumber),
  bikeIdIdx: index('idx_assignments_bike_id').on(table.bikeId),
  assignedDateIdx: index('idx_assignments_assigned_date').on(table.assignedDate),
}));

/**
 * Financial Records Table - Detailed financial tracking per case
 */
export const financialRecords = pgTable('financial_records', {
  id: text('id').primaryKey(),
  caseNumber: text('case_number').notNull(),
  recordDate: date('record_date').notNull(),
  description: text('description').notNull(),
  invoiced: decimal('invoiced', { precision: 10, scale: 2 }).notNull(),
  settled: decimal('settled', { precision: 10, scale: 2 }).notNull(),
  paid: decimal('paid', { precision: 10, scale: 2 }).notNull(),
  outstanding: decimal('outstanding', { precision: 10, scale: 2 }).notNull(), // Calculated field
  notes: text('notes'),
  createdDate: timestamp('created_date', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseNumber],
    foreignColumns: [cases.caseNumber],
    name: 'fk_financial_case'
  }),
  caseNumberIdx: index('idx_financial_case_number').on(table.caseNumber),
  recordDateIdx: index('idx_financial_record_date').on(table.recordDate),
}));

/**
 * Documents Table - File management for cases
 */
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  caseNumber: text('case_number').notNull(),
  filename: text('filename').notNull(),
  fileType: text('file_type').notNull(), // MIME type
  fileSize: integer('file_size').notNull(),
  filePath: text('file_path').notNull(), // Local file system or cloud storage path
  documentType: text('document_type'), // 'claims' | 'not-at-fault-rental' | 'certis-rental' | etc.
  description: text('description'),
  uploadedBy: text('uploaded_by'),
  uploadedDate: timestamp('uploaded_date', { withTimezone: true }).defaultNow(),
  isSigned: boolean('is_signed').default(false),
  signatureDate: timestamp('signature_date', { withTimezone: true }),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseNumber],
    foreignColumns: [cases.caseNumber],
    name: 'fk_document_case'
  }),
  caseNumberIdx: index('idx_documents_case_number').on(table.caseNumber),
  documentTypeIdx: index('idx_documents_type').on(table.documentType),
  uploadedDateIdx: index('idx_documents_uploaded_date').on(table.uploadedDate),
}));

// ===== SIGNATURE & WORKFLOW TABLES =====

/**
 * Signature Tokens Table - For secure document signing workflow
 */
export const signatureTokens = pgTable('signature_tokens', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(), // Secure random token
  caseId: text('case_id').notNull(),
  clientEmail: text('client_email').notNull(),
  documentType: text('document_type').notNull(),
  formData: jsonb('form_data'), // JSON string of form data
  formLink: text('form_link'),
  status: text('status').notNull().default('pending'), // 'pending' | 'accessed' | 'signed' | 'completed' | 'expired'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  jotformSubmissionId: text('jotform_submission_id'),
  pdfUrl: text('pdf_url'),
  documentUrl: text('document_url'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseId],
    foreignColumns: [cases.id],
    name: 'fk_signature_token_case'
  }),
  tokenIdx: index('idx_signature_tokens_token').on(table.token),
  caseIdIdx: index('idx_signature_tokens_case_id').on(table.caseId),
  statusIdx: index('idx_signature_tokens_status').on(table.status),
  expiresAtIdx: index('idx_signature_tokens_expires_at').on(table.expiresAt),
}));

/**
 * Digital Signatures Table - For capturing signatures
 */
export const digitalSignatures = pgTable('digital_signatures', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull(),
  signatureTokenId: text('signature_token_id'),
  signatureData: text('signature_data').notNull(), // Base64 encoded signature image
  signerName: text('signer_name').notNull(),
  signerEmail: text('signer_email'),
  termsAccepted: boolean('terms_accepted').default(false),
  signedAt: timestamp('signed_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseId],
    foreignColumns: [cases.id],
    name: 'fk_digital_signature_case'
  }),
  tokenRef: foreignKey({
    columns: [table.signatureTokenId],
    foreignColumns: [signatureTokens.id],
    name: 'fk_digital_signature_token'
  }),
  caseIdIdx: index('idx_digital_signatures_case_id').on(table.caseId),
  signedAtIdx: index('idx_digital_signatures_signed_at').on(table.signedAt),
}));

/**
 * Rental Agreements Table - Generated rental agreements
 */
export const rentalAgreements = pgTable('rental_agreements', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull(),
  signatureId: text('signature_id'),
  rentalDetails: jsonb('rental_details').$type<{
    hirer1Name: string;
    hirer1Email: string;
    hirer1Phone?: string;
    hirer1Address?: string;
    hirer1LicenceNo?: string;
    hirer1LicenceState?: string;
    hirer1LicenceExp?: string;
    hirer1Dob?: string;
    bikeMake: string;
    bikeModel: string;
    bikeRegistration: string;
    hireDate: string;
    returnDate: string;
    hireTime?: string;
    returnTime?: string;
    areaOfUse?: string;
  }>(),
  status: text('status').notNull().default('draft'), // 'draft' | 'sent' | 'signed' | 'completed'
  signedAt: timestamp('signed_at', { withTimezone: true }),
  signedBy: text('signed_by'),
  pdfUrl: text('pdf_url'),
  pdfPath: text('pdf_path'),
  pdfGeneratedAt: timestamp('pdf_generated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseId],
    foreignColumns: [cases.id],
    name: 'fk_rental_agreement_case'
  }),
  signatureRef: foreignKey({
    columns: [table.signatureId],
    foreignColumns: [digitalSignatures.id],
    name: 'fk_rental_agreement_signature'
  }),
  caseIdIdx: index('idx_rental_agreements_case_id').on(table.caseId),
  statusIdx: index('idx_rental_agreements_status').on(table.status),
}));

/**
 * Signed Documents Table - Secure document storage with metadata
 */
export const signedDocuments = pgTable('signed_documents', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull(),
  documentType: text('document_type').notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  sha256Hash: text('sha256_hash').notNull(),
  signedAt: timestamp('signed_at', { withTimezone: true }).notNull(),
  signedBy: text('signed_by').notNull(),
  signatureData: text('signature_data').notNull(),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  encryptionKeyId: text('encryption_key_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseId],
    foreignColumns: [cases.id],
    name: 'fk_signed_document_case'
  }),
  caseIdIdx: index('idx_signed_documents_case_id').on(table.caseId),
  documentTypeIdx: index('idx_signed_documents_type').on(table.documentType),
  signedAtIdx: index('idx_signed_documents_signed_at').on(table.signedAt),
  hashIdx: index('idx_signed_documents_hash').on(table.sha256Hash),
}));

// ===== COMMUNICATION & TRACKING TABLES =====

/**
 * Communication Logs Table - Track all communications
 */
export const communicationLogs = pgTable('communication_logs', {
  id: text('id').primaryKey(),
  caseNumber: text('case_number').notNull(),
  communicationDate: timestamp('communication_date', { withTimezone: true }).notNull(),
  logType: text('log_type').notNull(), // 'Email' | 'Phone' | 'SMS' | 'Letter' | 'Meeting' | 'Other'
  direction: text('direction').notNull(), // 'inbound' | 'outbound'
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  subject: text('subject'),
  message: text('message').notNull(),
  priority: text('priority').notNull().default('normal'), // 'low' | 'normal' | 'high' | 'urgent'
  followUpRequired: boolean('follow_up_required').default(false),
  followUpDate: date('follow_up_date'),
  createdBy: text('created_by'),
  createdDate: timestamp('created_date', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseNumber],
    foreignColumns: [cases.caseNumber],
    name: 'fk_communication_case'
  }),
  caseNumberIdx: index('idx_communications_case_number').on(table.caseNumber),
  communicationDateIdx: index('idx_communications_date').on(table.communicationDate),
  logTypeIdx: index('idx_communications_type').on(table.logType),
  priorityIdx: index('idx_communications_priority').on(table.priority),
}));

/**
 * Case Interactions Table - Structured interaction tracking
 */
export const caseInteractions = pgTable('case_interactions', {
  id: text('id').primaryKey(),
  caseNumber: text('case_number').notNull(),
  source: text('source').notNull(),
  method: text('method').notNull(),
  situation: text('situation').notNull(),
  action: text('action').notNull(),
  outcome: text('outcome').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseNumber],
    foreignColumns: [cases.caseNumber],
    name: 'fk_interaction_case'
  }),
  caseNumberIdx: index('idx_interactions_case_number').on(table.caseNumber),
  timestampIdx: index('idx_interactions_timestamp').on(table.timestamp),
}));

/**
 * Followup Notes Table - Scheduled follow-ups and reminders
 */
export const followupNotes = pgTable('followup_notes', {
  id: text('id').primaryKey(),
  caseNumber: text('case_number').notNull(),
  followupDate: date('followup_date').notNull(),
  followupType: text('followup_type').notNull(), // 'call' | 'email' | 'letter' | 'meeting' | 'other'
  description: text('description').notNull(),
  priority: text('priority').notNull().default('normal'), // 'low' | 'normal' | 'high' | 'urgent'
  assignedTo: text('assigned_to'),
  completed: boolean('completed').default(false),
  completedDate: timestamp('completed_date', { withTimezone: true }),
  createdBy: text('created_by'),
  createdDate: timestamp('created_date', { withTimezone: true }).defaultNow(),
  modifiedDate: timestamp('modified_date', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseNumber],
    foreignColumns: [cases.caseNumber],
    name: 'fk_followup_case'
  }),
  caseNumberIdx: index('idx_followups_case_number').on(table.caseNumber),
  followupDateIdx: index('idx_followups_date').on(table.followupDate),
  completedIdx: index('idx_followups_completed').on(table.completed),
  priorityIdx: index('idx_followups_priority').on(table.priority),
}));

// ===== BUSINESS ENTITIES =====

/**
 * Insurance Companies Table - Insurance company details
 */
export const insuranceCompanies = pgTable('insurance_companies', {
  id: text('id').primaryKey(),
  caseNumber: text('case_number').notNull(),
  companyName: text('company_name').notNull(),
  policyNumber: text('policy_number'),
  claimNumber: text('claim_number'),
  contactName: text('contact_name'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  notes: text('notes'),
  createdDate: timestamp('created_date', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseNumber],
    foreignColumns: [cases.caseNumber],
    name: 'fk_insurance_case'
  }),
  caseNumberIdx: index('idx_insurance_case_number').on(table.caseNumber),
  companyNameIdx: index('idx_insurance_company_name').on(table.companyName),
}));

/**
 * Collections Clients Table - For debt collection management
 */
export const collectionsClients = pgTable('collections_clients', {
  id: text('id').primaryKey(),
  caseNumber: text('case_number').notNull(),
  collectionsCompany: text('collections_company').notNull(),
  contactName: text('contact_name'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  assignedDate: date('assigned_date').notNull(),
  outstandingAmount: decimal('outstanding_amount', { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }),
  status: text('status').notNull().default('assigned'), // 'assigned' | 'in_progress' | 'resolved' | 'closed'
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdDate: timestamp('created_date', { withTimezone: true }).defaultNow(),
}, (table) => ({
  caseRef: foreignKey({
    columns: [table.caseNumber],
    foreignColumns: [cases.caseNumber],
    name: 'fk_collections_case'
  }),
  caseNumberIdx: index('idx_collections_case_number').on(table.caseNumber),
  statusIdx: index('idx_collections_status').on(table.status),
  assignedDateIdx: index('idx_collections_assigned_date').on(table.assignedDate),
  isActiveIdx: index('idx_collections_active').on(table.isActive),
}));

/**
 * User Accounts Table - For authentication and access control
 */
export const userAccounts = pgTable('user_accounts', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin' | 'developer' | 'lawyer' | 'rental_company' | 'workspace_user'
  status: text('status').notNull(), // 'active' | 'pending_password_change' | 'disabled'
  contactId: text('contact_id'),
  firstLogin: boolean('first_login').default(true),
  rememberLogin: boolean('remember_login').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
}, (table) => ({
  contactRef: foreignKey({
    columns: [table.contactId],
    foreignColumns: [contacts.id],
    name: 'fk_user_contact'
  }),
  emailIdx: index('idx_user_accounts_email').on(table.email),
  roleIdx: index('idx_user_accounts_role').on(table.role),
  statusIdx: index('idx_user_accounts_status').on(table.status),
}));

// ===== SCHEMA EXPORTS =====

/**
 * Export all tables for Drizzle queries
 */
export const schema = {
  contacts,
  workspaces,
  cases,
  bikes,
  bikeAssignments,
  financialRecords,
  documents,
  signatureTokens,
  digitalSignatures,
  rentalAgreements,
  signedDocuments,
  communicationLogs,
  caseInteractions,
  followupNotes,
  insuranceCompanies,
  collectionsClients,
  userAccounts,
};

// ===== ZOD SCHEMAS FOR VALIDATION =====

// Insert and select schemas for each table
export const insertContactSchema = createInsertSchema(contacts);
export const selectContactSchema = createSelectSchema(contacts);

export const insertWorkspaceSchema = createInsertSchema(workspaces);
export const selectWorkspaceSchema = createSelectSchema(workspaces);

export const insertCaseSchema = createInsertSchema(cases);
export const selectCaseSchema = createSelectSchema(cases);

export const insertBikeSchema = createInsertSchema(bikes);
export const selectBikeSchema = createSelectSchema(bikes);

export const insertBikeAssignmentSchema = createInsertSchema(bikeAssignments);
export const selectBikeAssignmentSchema = createSelectSchema(bikeAssignments);

export const insertFinancialRecordSchema = createInsertSchema(financialRecords);
export const selectFinancialRecordSchema = createSelectSchema(financialRecords);

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);

export const insertSignatureTokenSchema = createInsertSchema(signatureTokens);
export const selectSignatureTokenSchema = createSelectSchema(signatureTokens);

export const insertDigitalSignatureSchema = createInsertSchema(digitalSignatures);
export const selectDigitalSignatureSchema = createSelectSchema(digitalSignatures);

export const insertRentalAgreementSchema = createInsertSchema(rentalAgreements);
export const selectRentalAgreementSchema = createSelectSchema(rentalAgreements);

export const insertSignedDocumentSchema = createInsertSchema(signedDocuments);
export const selectSignedDocumentSchema = createSelectSchema(signedDocuments);

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs);
export const selectCommunicationLogSchema = createSelectSchema(communicationLogs);

export const insertCaseInteractionSchema = createInsertSchema(caseInteractions);
export const selectCaseInteractionSchema = createSelectSchema(caseInteractions);

export const insertFollowupNoteSchema = createInsertSchema(followupNotes);
export const selectFollowupNoteSchema = createSelectSchema(followupNotes);

export const insertInsuranceCompanySchema = createInsertSchema(insuranceCompanies);
export const selectInsuranceCompanySchema = createSelectSchema(insuranceCompanies);

export const insertCollectionsClientSchema = createInsertSchema(collectionsClients);
export const selectCollectionsClientSchema = createSelectSchema(collectionsClients);

export const insertUserAccountSchema = createInsertSchema(userAccounts);
export const selectUserAccountSchema = createSelectSchema(userAccounts);

// ===== TYPE EXPORTS =====

// Export TypeScript types inferred from the schema
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;

export type Bike = typeof bikes.$inferSelect;
export type NewBike = typeof bikes.$inferInsert;

export type BikeAssignment = typeof bikeAssignments.$inferSelect;
export type NewBikeAssignment = typeof bikeAssignments.$inferInsert;

export type FinancialRecord = typeof financialRecords.$inferSelect;
export type NewFinancialRecord = typeof financialRecords.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type SignatureToken = typeof signatureTokens.$inferSelect;
export type NewSignatureToken = typeof signatureTokens.$inferInsert;

export type DigitalSignature = typeof digitalSignatures.$inferSelect;
export type NewDigitalSignature = typeof digitalSignatures.$inferInsert;

export type RentalAgreement = typeof rentalAgreements.$inferSelect;
export type NewRentalAgreement = typeof rentalAgreements.$inferInsert;

export type SignedDocument = typeof signedDocuments.$inferSelect;
export type NewSignedDocument = typeof signedDocuments.$inferInsert;

export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type NewCommunicationLog = typeof communicationLogs.$inferInsert;

export type CaseInteraction = typeof caseInteractions.$inferSelect;
export type NewCaseInteraction = typeof caseInteractions.$inferInsert;

export type FollowupNote = typeof followupNotes.$inferSelect;
export type NewFollowupNote = typeof followupNotes.$inferInsert;

export type InsuranceCompany = typeof insuranceCompanies.$inferSelect;
export type NewInsuranceCompany = typeof insuranceCompanies.$inferInsert;

export type CollectionsClient = typeof collectionsClients.$inferSelect;
export type NewCollectionsClient = typeof collectionsClients.$inferInsert;

export type UserAccount = typeof userAccounts.$inferSelect;
export type NewUserAccount = typeof userAccounts.$inferInsert;

console.log('✅ PostgreSQL Schema loaded with Drizzle ORM');