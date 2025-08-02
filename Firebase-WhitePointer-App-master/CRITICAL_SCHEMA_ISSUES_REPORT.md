# Critical Schema Issues Report

## Executive Summary

This report identifies **CRITICAL** schema inconsistencies and data integrity issues that could cause significant problems in the application. Immediate action is required to resolve these conflicts.

## 🚨 CRITICAL ISSUES IDENTIFIED

### 1. **Multiple Conflicting Type Definitions**

**Issue**: The codebase has TWO different `Case` interfaces that are incompatible:

#### Simple Types (`src/types/case.ts`):
```typescript
interface Case {
  status: 'Quote' | 'Invoiced' | 'Agreed' | 'Settled' | 'Paid';
  clientName: string;
  atFaultPartyName: string;
  // ... basic fields
}
```

#### Comprehensive Types (`src/lib/firebase-schema-complete.ts`):
```typescript
interface Case {
  status: 'New Matter' | 'Customer Contacted' | 'Awaiting Approval' | 'Bike Delivered' | 'Bike Returned' | 'Demands Sent' | 'Awaiting Settlement' | 'Settlement Agreed' | 'Paid' | 'Closed';
  naf_name: string; // not-at-fault
  af_name: string;  // at-fault
  // ... comprehensive fields
}
```

**Impact**: 
- Runtime errors when status values don't match
- Data corruption potential
- TypeScript compilation issues
- UI components may break

### 2. **Field Name Convention Conflicts**

**Problem**: Mixed camelCase and snake_case usage:

| Simple Types | Comprehensive Types | Database Schema |
|-------------|-------------------|----------------|
| `clientName` | `naf_name` | `client_name` |
| `atFaultPartyName` | `af_name` | `at_fault_party_name` |
| `workspaceId` | `workspace_id` | `workspace_id` |

**Impact**: Field mapping errors, data loss, query failures

### 3. **Contact Type Enum Mismatch**

#### Simple Types:
```typescript
type ContactType = 'Insurer' | 'Lawyer' | 'Rental Company' | 'Service Center' | 'Client' | 'At-Fault Party'
```

#### Comprehensive Types:
```typescript
type ContactType = 'Client' | 'Lawyer' | 'Insurer' | 'Repairer' | 'Rental Company' | 'Service Center' | 'Other'
```

**Missing**: 'Other' in simple types, 'At-Fault Party' vs 'Repairer' conflict

### 4. **Bike Schema Inconsistencies**

#### Type Definition vs Database Schema:
- Type has `registrationExpires: string` (required)
- Database has `registration_expires TEXT` (optional)
- Missing fields: `serviceCenterContactId`, `assignedCaseId`, rate fields

### 5. **Workspace Schema Mismatch**

- Recently added `type` field to database schema
- `src/types/workspace.ts` doesn't include this field
- Potential null reference errors

## 🔧 RECOMMENDED IMMEDIATE ACTIONS

### 1. **Consolidate Type Definitions**
- Choose ONE authoritative schema (recommend comprehensive)
- Remove conflicting simple types
- Update all imports to use single source of truth

### 2. **Standardize Field Naming**
- Choose snake_case OR camelCase consistently
- Update database mapping functions
- Fix all TypeScript interfaces

### 3. **Update Database Schema**
- Add missing foreign key constraints (already implemented)
- Ensure all fields match type definitions
- Add proper indexes for performance

### 4. **Fix Contact Types**
- Merge both type definitions
- Update database enum constraints
- Fix UI dropdowns and validation

### 5. **Update Workspace Schema**
- Add `type` field to TypeScript interface
- Update creation and update functions
- Fix UI components

## 📋 IMPLEMENTATION PLAN

### Phase 1: Schema Consolidation (High Priority)
- [ ] Replace `src/types/case.ts` with comprehensive schema
- [ ] Update all imports across the codebase  
- [ ] Fix TypeScript compilation errors
- [ ] Update database mapping functions

### Phase 2: Field Name Standardization (High Priority)
- [ ] Choose naming convention (recommend snake_case for DB, camelCase for TS)
- [ ] Update all field mappings in `database.ts`
- [ ] Fix UI components and forms
- [ ] Update API endpoints

### Phase 3: Contact & Workspace Updates (Medium Priority)
- [ ] Merge ContactType definitions
- [ ] Add missing Workspace fields
- [ ] Update related UI components
- [ ] Test all functionality

### Phase 4: Bike Schema Alignment (Medium Priority)
- [ ] Align Bike type with database schema
- [ ] Update fleet management components
- [ ] Fix assignment logic

## 🚀 IMMEDIATE NEXT STEPS

1. **STOP** using `src/types/` definitions for Case, Contact
2. **MIGRATE** to `firebase-schema-complete.ts` as single source of truth
3. **UPDATE** all components to use new types
4. **TEST** thoroughly after each change

## ⚠️ RISK ASSESSMENT

**Current Risk Level**: **HIGH**

- Data corruption possible with mixed schemas
- Application crashes likely with type mismatches  
- User experience degraded with field mapping errors
- Development velocity severely impacted

**Timeline for Resolution**: **1-2 days** (immediate priority)