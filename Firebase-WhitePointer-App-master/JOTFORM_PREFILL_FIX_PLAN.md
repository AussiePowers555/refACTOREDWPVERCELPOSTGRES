# JotForm Prefill Fix - Comprehensive Task List

## 🚨 Root Cause Identified
The JotForm prefilling is failing because we're using generic field names (`client_name`, `client_email`) instead of the actual JotForm field IDs or unique names that the form expects.

## 📋 Fix Implementation Tasks

### Phase 1: Investigation & Field Mapping
- [x] ✅ Research JotForm API prefilling documentation and limitations
- [x] ✅ Search Reddit and forums for JotForm prefilling issues  
- [x] ✅ Web search for JotForm URL parameter handling
- [x] ✅ Analyze current JotForm integration implementation
- [ ] 🔄 **Get correct field IDs for Claims Form (232543267390861)**
- [ ] 🔄 **Create field mapping for all document types**
- [ ] 🔄 **Test direct JotForm URL with correct field IDs**

### Phase 2: Code Fixes
- [ ] 🔄 **Update JotForm field mapping functions with correct field IDs**
- [ ] 🔄 **Implement field ID validation system**
- [ ] 🔄 **Add fallback mechanism for unmapped fields**
- [ ] 🔄 **Update URL generation to use field IDs instead of generic names**

### Phase 3: Testing & Validation
- [ ] 🔄 **Create Playwright test for prefilled form workflow**
- [ ] 🔄 **Test with whitepointer2016@gmail.com case (Case: 2025-001)**
- [ ] 🔄 **Verify all document types work correctly**
- [ ] 🔄 **Test email delivery and link functionality**

### Phase 4: Monitoring & Documentation
- [ ] 🔄 **Add comprehensive logging for debugging**
- [ ] 🔄 **Create troubleshooting guide**
- [ ] 🔄 **Document correct field mapping process**

## 🔧 Immediate Actions Required

### 1. Get Correct JotForm Field IDs
**Method A: Manual Inspection (Recommended)**
- Open form in builder: https://www.jotform.com/build/232543267390861
- For each field: Click gear icon → Advanced → Field Details → copy Field ID
- Use CTRL+Shift+I in form builder to see all unique names at once

**Method B: Form Source Analysis**
- View form source HTML and extract field IDs from input elements
- Look for pattern: `input_X` where X is the field ID

**Method C: API Approach (if API key available)**
- GET https://api.jotform.com/form/232543267390861/questions
- Extract field IDs from response

### 2. Priority Field Mappings Needed

Based on Case 2025-001 data, we need field IDs for:
```
- Panel Shop Name: "Tims"
- Contact: "555 555" 
- Driver: "Greg"
- Mobile No: "0413063463"
- Email: "whitepointer2016@gmail.com"
- Insurance Company: [empty]
- Claim Number: [empty]
- Make/Model/Year/Rego: [vehicle details]
- Accident Details: [description]
- Accident Location: [location]
```

## 🐛 Specific Issues to Address

### Current Code Problems:
1. **Wrong Parameter Names**: Using `client_name` instead of field ID like `4`
2. **No Field Validation**: No check if fields actually exist in form
3. **Missing Error Handling**: No fallback if prefilling fails
4. **Debug Information**: Limited logging to troubleshoot issues

### JotForm-Specific Issues:
1. **Form Settings**: Check if "Clear Hidden Field Values" is enabled
2. **Field Types**: Ensure field types support prefilling
3. **Form Version**: Verify we're using current form version
4. **Cache Issues**: May need to clear JotForm cache

## ⚡ Quick Test Implementation

```typescript
// Test URL with known field IDs (example)
const testUrl = "https://form.jotform.com/232543267390861?4=John%20Smith&5=whitepointer2016@gmail.com&6=0413063463";

// Test this URL directly to verify prefilling works
// If it works, we know the issue is field ID mapping
// If it doesn't work, we have form-level issues
```

## 🧪 Playwright Test Strategy

```typescript
// Test Scenario 1: Direct Form Access
test('JotForm prefill with correct field IDs', async ({ page }) => {
  await page.goto('https://form.jotform.com/232543267390861?4=John%20Smith&5=whitepointer2016@gmail.com');
  await expect(page.locator('[name="q4_driver"]')).toHaveValue('John Smith');
  await expect(page.locator('[name="q5_email"]')).toHaveValue('whitepointer2016@gmail.com');
});

// Test Scenario 2: Complete Workflow
test('End-to-end prefilled form workflow', async ({ page }) => {
  // 1. Save draft in app
  // 2. Send email 
  // 3. Click secure link
  // 4. Verify form is prefilled
  // 5. Submit form
  // 6. Verify webhook received
});
```

## 🎯 Success Criteria

- [ ] ✅ JotForm loads with prefilled data visible
- [ ] ✅ Email delivery works with correct secure link
- [ ] ✅ All required fields are populated from case data
- [ ] ✅ Form submission completes successfully
- [ ] ✅ Webhook processes signed document
- [ ] ✅ Status updates to "Sent" in case management

## 🚀 Next Steps

1. **IMMEDIATE**: Get field IDs for Claims Form (232543267390861)
2. **HIGH PRIORITY**: Update field mapping in `jotform.ts`
3. **TEST**: Verify with Case 2025-001 and whitepointer2016@gmail.com
4. **EXPAND**: Apply fix to all document types
5. **MONITOR**: Add comprehensive logging for future debugging

---

**Estimated Fix Time**: 2-4 hours for complete implementation and testing
**Risk Level**: Low - Changes are isolated to field mapping logic
**Impact**: High - Fixes core document signing workflow