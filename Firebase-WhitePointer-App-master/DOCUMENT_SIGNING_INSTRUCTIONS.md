# Document Signing Instructions

## Why You're Getting "This link has expired or is invalid" Error

The error occurs because:
1. There are no signature tokens in the database (I checked and found 0 tokens)
2. The `/sign-agreement` page is a mock page that doesn't use the token system
3. You need to use the proper document signing workflow

## Correct Document Signing Workflow

### For Sending Documents to Clients:

1. **Navigate to a specific case** in the Cases section
2. Click **"Sign Documents"** button (this takes you to `/document-signing/[caseNumber]`)
3. On the document signing page:
   - Verify/edit client email and phone number
   - Click on any document type (Authority to Act, Claims Form, etc.)
   - Preview the form with pre-filled case data
   - Click "Send via Email" or "Send via SMS"
4. The system will:
   - Create a secure signature token (valid for 72 hours)
   - Send an email/SMS to the client with a secure link
   - The link will be in format: `/forms/[documentType]/[secureToken]`

### For Clients Receiving Documents:

1. Client receives email/SMS with secure link
2. Clicks the link to access the form
3. Form is pre-filled with their case data
4. Client reviews and signs the document
5. Upon submission, the document is processed

## Important Notes

- The `/sign-agreement` page has been updated to redirect users to the proper flow
- Signature tokens expire after 72 hours for security
- Each document type has its own form (Authority to Act, Claims Form, etc.)
- The system tracks document status: pending → sent → signed → completed

## Testing the System

To test document signing:
1. Go to Cases section
2. Select any case (you created 5 mock cases earlier)
3. Click "Sign Documents"
4. Make sure the case has an email address
5. Send a test document via email
6. Check the email for the secure link

The document signing system is now properly configured to use secure tokens and the correct workflow.