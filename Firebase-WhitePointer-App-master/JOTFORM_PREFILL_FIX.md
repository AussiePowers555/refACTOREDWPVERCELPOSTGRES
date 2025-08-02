# JotForm Prefill Fix Documentation

## Problem Description

The issue was that prefilled forms sent via email were not displaying the prefilled information when users clicked the secure link. Users would see an empty JotForm instead of a form populated with their case data.

## Root Cause Analysis

The problem occurred in the token and URL generation workflow:

1. **Original Broken Flow:**
   ```
   1. Create form data object
   2. Build JotForm URL with temporary token
   3. Create signature token with incomplete form_link
   4. Build "actual" JotForm URL with real token
   5. Send email with JotForm link
   6. Portal validates token and reconstructs URL incorrectly
   ```

2. **Issue:** The signature portal was appending `?signature_token=${token}` to the stored `form_link`, but the stored link already contained parameters, causing URL malformation and loss of prefilled data.

## Fix Implementation

### 1. Updated Token Creation Flow

**File: `/src/app/api/documents/send-for-signature/route.ts`**

```typescript
// OLD - Broken approach
const tempToken = 'temp-token';
const tempFormLink = buildJotFormURL(documentType, formData, tempToken);
const token = await createSignatureToken(caseNumber, clientEmail, documentType, formData, tempFormLink.replace(tempToken, ''));
const jotFormLink = buildJotFormURL(documentType, formData, token);

// NEW - Fixed approach  
const token = await createSignatureToken(caseNumber, clientEmail, documentType, formData, '');
const jotFormLink = buildJotFormURL(documentType, formData, token);
await updateSignatureTokenFormLink(token, jotFormLink);
```

### 2. Enhanced Form Data Mapping

**File: `/src/lib/jotform.ts`**

- Added comprehensive logging to track URL generation
- Enhanced field mapping functions with debugging
- Added support for additional case data fields (NAF fields, accident details, etc.)
- Improved parameter handling for different document types

### 3. Fixed Portal URL Handling

**File: `/src/app/api/signature-portal/validate-token/route.ts`**

```typescript
// OLD - Reconstructing URL incorrectly
formLink: signatureToken.form_link + `?signature_token=${token}`

// NEW - Using stored complete URL
formLink: signatureToken.form_link // Already contains token and prefilled data
```

### 4. Added Token Update Function

**File: `/src/lib/signature-tokens.ts`**

```typescript
export async function updateSignatureTokenFormLink(token: string, formLink: string): Promise<void>
```

This function updates the signature token with the correct JotForm URL after it's been built with the real token.

## How It Works Now

### Complete Workflow

1. **Form Sending Request**
   ```
   POST /api/documents/send-for-signature
   Body: {
     caseNumber, documentType, method, 
     clientEmail, clientName, clientPhone,
     ...otherCaseData
   }
   ```

2. **Token Creation Process**
   ```
   1. Create comprehensive form data object
   2. Generate secure signature token
   3. Build JotForm URL with token + prefilled parameters
   4. Update token with complete form URL
   5. Send email/SMS with portal link
   ```

3. **Email/SMS Content**
   - Contains link to secure portal: `/secure-signature-portal/{token}`
   - Portal validates token and redirects to stored JotForm URL
   - JotForm URL contains all prefilled parameters

4. **User Experience**
   ```
   Email → Portal Link → Token Validation → JotForm with Prefilled Data
   ```

## Testing the Fix

### Manual Testing

1. **Test the workflow:**
   ```bash
   curl -X POST /api/test-jotform-prefill \
     -H "Content-Type: application/json" \
     -d '{"documentType": "claims"}'
   ```

2. **Check URL generation:**
   ```bash
   curl -X GET /api/test-jotform-prefill
   ```

### Verification Steps

1. ✅ **Token Creation**: Verify token is created with form_data
2. ✅ **URL Generation**: Check JotForm URL contains all expected parameters
3. ✅ **Token Update**: Confirm token is updated with complete form_link
4. ✅ **Portal Validation**: Ensure portal returns correct form_link
5. ✅ **Parameter Preservation**: Verify prefilled data survives the entire workflow

## Supported Document Types

| Document Type | JotForm ID | Key Parameters |
|---------------|------------|----------------|
| `claims` | 232543267390861 | client_name, client_email, case_number, accident_date |
| `not-at-fault-rental` | 233241680987464 | hirer_name, hirer_email, rental_case_number |
| `certis-rental` | 233238940095055 | certis_hirer_name, certis_case_number |
| `authority-to-act` | 233183619631457 | principal_name, authority_case_number |
| `direction-to-pay` | 233061493503046 | payer_name, payment_case_number |

## Key Parameters Passed to JotForm

### Common Parameters
- `signature_token`: Security token for tracking
- `case_number`/`*_case_number`: Case identifier
- `client_name`/`*_name`: Client name
- `client_email`/`*_email`: Client email
- `client_phone`/`*_phone`: Client phone

### Claims-Specific Parameters
- `client_address`, `client_suburb`, `client_state`, `client_postcode`
- `af_party_name`, `af_party_phone`: At-fault party details
- `accident_date`, `accident_time`, `accident_location`
- `client_insurer`, `client_claim_number`

### Rental-Specific Parameters
- `hirer_address`, `hirer_suburb`, `hirer_state`, `hirer_postcode`
- `hirer_dob`, `hirer_licence_no`: Driver details
- `rental_start_date`: Rental commencement

## Debugging

### Console Logs to Monitor

1. **Form Data Creation**
   ```
   "Form data being sent to JotForm: {...}"
   ```

2. **URL Generation**
   ```
   "Building JotForm URL for claims with data: {...}"
   "Generated JotForm URL: https://form.jotform.com/..."
   ```

3. **Token Operations**
   ```
   "✅ Signature token created: abc123..."
   "✅ Updated token with form link: {...}"
   ```

4. **Parameter Mapping**
   ```
   "Added claims param: client_name = John Smith"
   "Added claims param: case_number = WW2412001"
   ```

### Common Issues and Solutions

1. **Empty Form Despite Fix**
   - Check console logs for parameter mapping
   - Verify JotForm field names match parameter names
   - Ensure form_data contains expected case fields

2. **Token Not Found**
   - Check Firebase connection
   - Verify token storage (Firebase vs localStorage fallback)
   - Check token expiration (72 hours)

3. **URL Malformation**
   - Check for special characters in case data
   - Verify URL encoding is working correctly
   - Test with minimal case data first

## Files Modified

1. `/src/app/api/documents/send-for-signature/route.ts` - Fixed token creation flow
2. `/src/lib/signature-tokens.ts` - Added updateSignatureTokenFormLink function
3. `/src/lib/jotform.ts` - Enhanced URL building and field mapping
4. `/src/app/api/signature-portal/validate-token/route.ts` - Fixed URL reconstruction
5. `/src/lib/server-storage.ts` - Added fallback storage method
6. `/src/lib/jotform-debug.ts` - Added debugging utilities
7. `/src/app/api/test-jotform-prefill/route.ts` - Added test endpoint

## Expected Outcome

When users receive an email with a signature request and click the secure link:

1. ✅ Portal validates the token successfully
2. ✅ Portal redirects to JotForm with prefilled data
3. ✅ User sees form populated with their case information
4. ✅ User only needs to review and add signature
5. ✅ Form submission works correctly with webhook processing

The prefilled form should contain all relevant case data, making the signing process seamless for clients.