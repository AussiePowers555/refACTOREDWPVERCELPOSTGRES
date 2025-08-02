export interface IDatabaseService {
  // Cases
  createCase(caseData: any): Promise<any>;
  getCaseById(id: string): Promise<any | null>;
  getCaseByCaseNumber(caseNumber: string): Promise<any | null>;
  getAllCases(): Promise<any[]>;
  updateCase(id: string, caseData: any): Promise<void>;
  deleteCase(id: string): Promise<boolean>;
  
  // Contacts
  createContact(contact: any): Promise<any>;
  getAllContacts(): Promise<any[]>;
  
  // Workspaces
  createWorkspace(workspace: any): Promise<any>;
  getAllWorkspaces(): Promise<any[]>;
  updateWorkspace(id: string, updates: any): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  
  // User Accounts
  createUserAccount(account: any): Promise<any>;
  getAllUserAccounts(): Promise<any[]>;
  updateUserAccount(id: string, updates: any): Promise<void>;
  getUserByEmail(email: string): Promise<any | undefined>;
  
  // Signature Tokens
  createSignatureToken(tokenData: any): Promise<any>;
  getSignatureToken(token: string): Promise<any | null>;
  updateSignatureToken(id: string, updates: any): Promise<void>;
  getSignatureTokensForCase(caseId: string): Promise<any[]>;
  
  // Digital Signatures
  createDigitalSignature(signatureData: any): Promise<any>;
  
  // Rental Agreements
  createRentalAgreement(agreementData: any): Promise<any>;
  updateRentalAgreement(id: string, updates: any): Promise<void>;
  
  // Bikes
  createBike(bikeData: any): Promise<any>;
  getAllBikes(): Promise<any[]>;
  getBikeById(id: string): Promise<any | null>;
  updateBike(id: string, updates: any): Promise<void>;
  deleteBike(id: string): Promise<void>;
  bulkInsertBikes(bikes: any[]): Promise<void>;
  
  // Bulk operations
  deleteSignatureTokensByCase(caseId: string): Promise<number>;
  deleteDigitalSignaturesByCase(caseId: string): Promise<number>;
  deleteRentalAgreementsByCase(caseId: string): Promise<number>;
}
