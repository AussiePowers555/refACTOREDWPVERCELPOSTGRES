# Case Storage Unification Plan
**Comprehensive Solution to Fix "Case Not Found" Errors**

## Executive Summary

The application currently suffers from "case not found" errors due to **dual data storage architecture** where components save case data to SQLite database but other components read from localStorage. This creates data inconsistency where cases exist in the database but are not accessible to localStorage-dependent components.

**Root Cause:** Two separate, non-communicating storage systems:
1. **Primary System (SQLite):** Used by main cases UI (`/api/cases`)
2. **Legacy System (localStorage):** Used by document signing, commitments, financials, etc.

**Solution:** Unify all case operations to use SQLite database as the single source of truth.

---

## Current Architecture Analysis

### Components Using SQLite (Working Correctly)
- **File:** `src/app/(app)/cases/page.tsx`
- **Hook:** `useCases()` from `use-database.ts`
- **API:** `/api/cases/route.ts`
- **Storage:** SQLite via `DatabaseService`

### Components Using localStorage (Causing Errors)
| Component | File Path | Issue |
|-----------|-----------|-------|
| Document Signing | `src/app/document-signing/[caseNumber]/page.tsx:25` | Reads `cases` from localStorage |
| Commitments | `src/app/(app)/commitments/page.tsx:25` | Reads `cases` from localStorage |
| Interactions | `src/app/(app)/interactions/page.tsx:36` | Reads `cases` from localStorage |
| Financials | `src/app/(app)/financials/page.tsx:15` | Reads `cases` from localStorage |
| Rental Agreement | `src/app/rental-agreement/[caseId]/rental-agreement-form.tsx:23` | Reads `cases` from localStorage |

### Infrastructure Already Available
- ✅ **SQLite Database:** `src/lib/database.ts` with `DatabaseService`
- ✅ **API Endpoints:** `/api/cases/route.ts` with GET/POST operations
- ✅ **Database Hook:** `use-database.ts` with `useCases()` function
- ✅ **Schema Support:** Complete case schema in database

---

## Solution Strategy

### Phase 1: Database API Enhancements
**Objective:** Ensure SQLite API supports all required case operations

#### 1.1 API Endpoints Assessment
- ✅ **GET /api/cases** - Fetch all cases (implemented)
- ✅ **POST /api/cases** - Create new case (implemented)
- ❌ **GET /api/cases/[id]** - Fetch single case by ID (missing)
- ❌ **PUT /api/cases/[id]** - Update existing case (missing)
- ❌ **DELETE /api/cases/[id]** - Delete case (missing)

#### 1.2 Required API Endpoints to Add
```typescript
// src/app/api/cases/[id]/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } })
export async function PUT(request: NextRequest, { params }: { params: { id: string } })
export async function DELETE(request: NextRequest, { params }: { params: { id: string } })
```

#### 1.3 Database Service Enhancements
The `DatabaseService` in `src/lib/database.ts` needs these methods:
```typescript
// Add to DatabaseService class
getCaseById(caseNumber: string): Case | null
updateCase(caseNumber: string, updates: Partial<Case>): Case
deleteCase(caseNumber: string): boolean
getCaseByField(field: string, value: any): Case | null
```

### Phase 2: Component Migration Strategy
**Objective:** Replace localStorage usage with SQLite API calls

#### 2.1 Migration Pattern
**Before (localStorage):**
```typescript
const [cases] = useLocalStorage<Case[]>("cases", []);
const caseData = cases.find(c => c.caseNumber === caseNumber);
```

**After (SQLite API):**
```typescript
const { data: cases, loading, error } = useCases();
const caseData = cases.find(c => c.caseNumber === caseNumber);
```

#### 2.2 Component-Specific Migration Plans

##### Document Signing Component
**File:** `src/app/document-signing/[caseNumber]/page.tsx`
- **Current Issue:** Line 25 uses localStorage to find case
- **Solution:** Replace with API call to `/api/cases/${caseNumber}`
- **Changes Required:** 
  - Remove `useLocalStorage` import and usage
  - Add direct API fetch for single case
  - Handle loading/error states
  - Update case data validation logic (lines 61-67)

##### Commitments Page
**File:** `src/app/(app)/commitments/page.tsx`
- **Current Issue:** Line 25 reads cases from localStorage
- **Solution:** Replace with `useCases()` hook
- **Changes Required:**
  - Replace `useLocalStorage` with `useCases()`
  - Update `getCommitmentsWithCaseData` function
  - Handle loading states in UI
  - Add error handling for failed API calls

##### Interactions Page  
**File:** `src/app/(app)/interactions/page.tsx`
- **Current Issue:** Line 36 reads cases from localStorage
- **Solution:** Replace with `useCases()` hook
- **Changes Required:**
  - Replace `useLocalStorage` with `useCases()`
  - Update `useEffect` to work with API data
  - Handle loading states during data fetch
  - Maintain interaction log localStorage separately (non-case data)

##### Financials Page
**File:** `src/app/(app)/financials/page.tsx`
- **Current Issue:** Line 15 reads cases from localStorage  
- **Solution:** Replace with `useCases()` hook
- **Changes Required:**
  - Replace `useLocalStorage` with `useCases()`
  - Update financial calculations to work with API data
  - Add loading states for financial metrics
  - Handle empty case scenarios

##### Rental Agreement Form
**File:** `src/app/rental-agreement/[caseId]/rental-agreement-form.tsx`
- **Current Issue:** Line 23 reads cases from localStorage
- **Solution:** Direct API call for single case
- **Changes Required:**
  - Remove `useLocalStorage` usage for cases
  - Add API fetch for specific case by ID
  - Keep bike data localStorage (separate concern)
  - Update loading and error handling logic

### Phase 3: Data Migration Strategy
**Objective:** Preserve existing localStorage case data during transition

#### 3.1 Migration Script Requirements
Create `src/scripts/migrate-localstorage-to-sqlite.ts`:

```typescript
// Migration script outline
async function migrateLocalStorageToSQLite() {
  // 1. Read existing cases from localStorage
  // 2. Validate data structure
  // 3. Insert into SQLite database (avoid duplicates)
  // 4. Verify migration success
  // 5. Create backup of localStorage data
  // 6. Optional: Clear localStorage cases after confirmation
}
```

#### 3.2 Migration Process
1. **Pre-Migration Backup:** Export localStorage cases to JSON file
2. **Data Validation:** Check case data integrity and required fields
3. **Duplicate Detection:** Compare with existing SQLite cases by caseNumber
4. **Selective Migration:** Only migrate cases not already in SQLite
5. **Post-Migration Verification:** Ensure all cases accessible via API
6. **Cleanup:** Archive localStorage case data (don't delete immediately)

### Phase 4: Legacy Code Cleanup
**Objective:** Remove unused Firebase/localStorage case storage system

#### 4.1 Files to Remove/Modify
- **Remove:** `src/lib/case-storage.ts` (unused CaseStorageService)
- **Modify:** Remove Firebase case storage configurations
- **Cleanup:** Unused imports related to Firebase case storage

#### 4.2 Preserve Non-Case localStorage Usage
**Keep these localStorage usages (not related to cases):**
- Commitments data: `useLocalStorage<Commitment[]>("commitments", [])`
- Interaction logs: `localStorage.getItem('interactions_${caseNumber}')`
- Bike data: `useLocalStorage<Bike[]>("bikes", [])`
- Other non-case related localStorage

---

## Implementation Steps

### Step 1: API Infrastructure Setup
1. **Create single case API endpoint:** `/api/cases/[id]/route.ts`
2. **Add DatabaseService methods:** `getCaseById`, `updateCase`, `deleteCase`
3. **Test API endpoints** with existing case data

### Step 2: Component Updates (Priority Order)
1. **Document Signing** (highest priority - critical user flow)
2. **Rental Agreement Form** (high priority - user-facing)
3. **Commitments Page** (medium priority - daily operations)
4. **Financials Page** (medium priority - reporting)
5. **Interactions Page** (low priority - reporting only)

### Step 3: Data Migration
1. **Create migration script**
2. **Test migration on development environment**
3. **Create rollback procedure**
4. **Execute migration in production**

### Step 4: Testing & Validation
1. **Unit tests** for new API endpoints
2. **Integration tests** for component data loading
3. **End-to-end tests** for document signing workflow
4. **Performance testing** for API response times

### Step 5: Cleanup & Documentation
1. **Remove legacy code**
2. **Update component documentation**
3. **Create operational runbook**

---

## Risk Assessment & Mitigation

### High Risk Items
| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Full backup + staged rollout |
| API performance degradation | Medium | Database indexing + caching |
| Component breaking changes | High | Comprehensive testing suite |

### Rollback Strategy
1. **Database Backup:** Complete SQLite backup before migration
2. **Code Rollback:** Git branch with previous localStorage implementation
3. **Data Recovery:** Restore localStorage from backup files
4. **API Rollback:** Revert API changes if performance issues

---

## Success Criteria

### Primary Goals
- ✅ All "case not found" errors eliminated
- ✅ Consistent case data across all components
- ✅ Single source of truth for case data
- ✅ No data loss during migration

### Performance Targets
- API response time < 200ms for single case fetch
- Page load time improvement for case-dependent pages
- Database query optimization for case lookups

### Quality Metrics
- 100% test coverage for new API endpoints
- 0 localStorage dependencies for case data
- All existing functionality preserved

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| API Infrastructure | 2-3 days | Database access |
| Component Migration | 5-7 days | API completion |
| Data Migration | 1-2 days | Component testing |
| Testing & Validation | 3-4 days | Migration completion |
| Cleanup & Documentation | 1-2 days | Testing approval |

**Total Estimated Duration:** 12-18 days

---

## Technical Architecture Diagram

```mermaid
graph TB
    subgraph "Current (Broken) Architecture"
        UI1[Cases List UI]
        UI2[Document Signing]
        UI3[Commitments]
        UI4[Financials]
        
        UI1 --> API[/api/cases]
        API --> DB[(SQLite Database)]
        
        UI2 --> LS[localStorage]
        UI3 --> LS
        UI4 --> LS
    end
    
    subgraph "Target (Unified) Architecture"
        UI1_NEW[Cases List UI]
        UI2_NEW[Document Signing]
        UI3_NEW[Commitments]
        UI4_NEW[Financials]
        
        UI1_NEW --> API_NEW[/api/cases/*]
        UI2_NEW --> API_NEW
        UI3_NEW --> API_NEW
        UI4_NEW --> API_NEW
        
        API_NEW --> DB_NEW[(SQLite Database)]
    end
```

---

## Conclusion

This comprehensive plan addresses the root cause of "case not found" errors by eliminating the dual storage architecture. The solution prioritizes data integrity, maintains existing functionality, and provides a clear migration path with minimal risk.

**Key Benefits:**
- ✅ Eliminates data inconsistency issues
- ✅ Improves application reliability  
- ✅ Simplifies data management
- ✅ Enables better performance monitoring
- ✅ Reduces technical debt

The plan provides a systematic approach to unify case data storage while preserving all existing functionality and ensuring zero data loss during the transition.