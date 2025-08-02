/**
 * Test data fixtures for signature workflow testing
 */

export const testCases = {
  validCase: {
    caseNumber: 'TEST001',
    clientName: 'John Doe',
    clientEmail: 'john.doe@example.com',
    clientPhone: '+61400000000',
    atFaultPartyName: 'Jane Smith',
    atFaultPartyEmail: 'jane.smith@example.com',
    status: 'Quote' as const,
    lastUpdated: '2024-07-29',
    clientStreetAddress: '123 Test Street',
    clientSuburb: 'Sydney',
    clientState: 'NSW',
    clientPostcode: '2000',
    accidentDate: '2024-07-20',
    accidentTime: '14:30',
    accidentDescription: 'Rear-end collision at traffic lights'
  },
  expiredCase: {
    caseNumber: 'TEST002',
    clientName: 'Bob Wilson',
    clientEmail: 'bob.wilson@example.com',
    clientPhone: '+61400000001',
    atFaultPartyName: 'Alice Brown',
    status: 'Settled' as const,
    lastUpdated: '2024-07-15'
  }
};

export const testTokens = {
  validToken: 'valid-token-456',
  expiredToken: 'expired-token-123',
  invalidToken: 'invalid-token-789',
  usedToken: 'used-token-999'
};

export const documentTypes = {
  claims: {
    id: 'claims',
    name: 'Claims Form',
    description: 'Submit your insurance claim details',
    jotformId: '232543267390861'
  },
  notAtFaultRental: {
    id: 'not-at-fault-rental',
    name: 'Not At Fault Rental',
    description: 'Rental agreement for not-at-fault parties',
    jotformId: '233241680987464'
  },
  certisRental: {
    id: 'certis-rental',
    name: 'Certis Rental',
    description: 'Certis rental agreement form',
    jotformId: '233238940095055'
  },
  authorityToAct: {
    id: 'authority-to-act',
    name: 'Authority to Act',
    description: 'Authorization for legal representation',
    jotformId: '233183619631457'
  },
  directionToPay: {
    id: 'direction-to-pay',
    name: 'Direction to Pay',
    description: 'Payment direction authorization',
    jotformId: '233061493503046'
  }
};

export const mockJotFormSubmission = {
  submissionID: '12345',
  formID: '232543267390861',
  rawRequest: JSON.stringify({
    submission_id: '12345',
    form_id: '232543267390861',
    status: 'ACTIVE',
    created_at: '2024-07-29 10:00:00',
    updated_at: '2024-07-29 10:00:00'
  })
};

export const mockSignatureTokens = {
  pending: {
    token: 'pending-token-123',
    case_id: 'TEST001',
    client_email: 'john.doe@example.com',
    form_data: testCases.validCase,
    status: 'pending' as const,
    expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
    document_type: 'claims',
    form_link: 'https://form.jotform.com/232543267390861?prefill=true'
  },
  expired: {
    token: 'expired-token-123',
    case_id: 'TEST002',
    client_email: 'bob.wilson@example.com',
    form_data: testCases.expiredCase,
    status: 'expired' as const,
    expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    document_type: 'claims',
    form_link: 'https://form.jotform.com/232543267390861?prefill=true'
  },
  completed: {
    token: 'completed-token-456',
    case_id: 'TEST001',
    client_email: 'john.doe@example.com',
    form_data: testCases.validCase,
    status: 'completed' as const,
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
    signed_at: new Date(),
    completed_at: new Date(),
    document_type: 'claims',
    form_link: 'https://form.jotform.com/232543267390861?prefill=true',
    jotform_submission_id: '12345'
  }
};

export const mockEmailTemplates = {
  signatureRequest: {
    subject: 'Digital Signature Required - Case {caseNumber}',
    template: `
      <h2>Digital Signature Required</h2>
      <p>Dear {clientName},</p>
      <p>Please click the link below to digitally sign your {documentType}:</p>
      <a href="{signatureLink}">Sign Document</a>
      <p>This link will expire in 72 hours.</p>
      <p>Best regards,<br>White Pointer Recoveries</p>
    `
  }
};

export const apiResponses = {
  success: {
    success: true,
    message: 'Operation completed successfully',
    data: {}
  },
  error: {
    success: false,
    error: 'An error occurred',
    code: 'GENERIC_ERROR'
  },
  validationError: {
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: ['Required field missing']
  }
};
