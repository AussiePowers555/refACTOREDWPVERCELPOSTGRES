# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 9003 with Turbopack)
- **Start development server with ngrok**: `npm run dev:ngrok` (automated ngrok tunnel)


- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Run linting**: `npm run lint`
- **Run type checking**: `npm run typecheck`
- **Run tests**: Tests use Playwright - configuration in `playwright.config.ts`


## Architecture Overview

This is a Next.js application for a motorbike rental management system (PBikeRescue Rails) with the following architecture:

### Core Stack
- **Framework**: Next.js 15.3.3 with TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with email link authentication
- **Storage**: Firebase Storage
- **AI Integration**: Google Genkit for AI-powered email generation
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Forms**: React Hook Form with Zod validation

### Key Directories
- `src/app/` - Next.js app router pages and API routes
  - `(app)/` - Main application pages (cases, fleet, contacts, etc.)
  - `api/` - API endpoints for webhooks, document signing, email/SMS
- `src/components/` - Reusable UI components (using shadcn/ui pattern)
- `src/lib/` - Core utilities and Firebase services
- `src/context/` - React context providers (AuthContext)
- `src/ai/` - Genkit AI flows for email generation

### Important Files
- `src/lib/firebase.ts` - Firebase initialization and configuration
- `src/lib/firebase-schema-complete.ts` - Complete TypeScript schema definitions
- `src/lib/firebase-services.ts` - Firebase service layer implementation
- `src/context/AuthContext.tsx` - Authentication state management

### Core Features
1. **Case Management** - Track motorbike rental cases with status progression
2. **Fleet Tracking** - Manage bike inventory and assignments
3. **Financial Records** - Handle transactions and financial tracking
4. **AI Email Generation** - Generate collection emails with varying tones
5. **Document Management** - Store and manage case-related documents
6. **Insurance Management** - Store insurance provider details
7. **Subscription Management** - User subscription handling

### Environment Configuration
The app uses Firebase configuration from environment variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Security Note
Current Firestore rules (`firestore.rules`) allow all read/write access for development. These should be properly configured before production deployment.

## Project Overview: Motorbike Rental Management System

This is a comprehensive web application for managing a motorbike rental business that specializes in providing replacement vehicles to not-at-fault (NAF) victims of accidents. The system manages the entire case lifecycle, from client intake to final payment recovery from the at-fault (AF) party's insurer.

### Core Data Structure

The system revolves around several key data entities:

- **Case**: The central entity, containing all information related to an accident claim. It stores details for the NAF client, the AF party, accident specifics, case status, assigned bike, and a denormalized financial summary (invoiced, settled, paid). A unique case number (WWMM###) is auto-generated.

- **Bike**: Represents a motorcycle in the fleet. It tracks the bike's make, model, registration, service history, and assigned_case status.

- **BikeAssignment**: A linking table that connects a Bike to a Case. It specifies the rental period (assigned_date, returned_date) and the daily rental rates.

- **FinancialRecord**: Stores detailed financial transactions for each case, tracking amounts invoiced, settled, and paid over time.

- **Document**: Manages all files associated with a case, such as uploaded PDFs and images.

- **DigitalSignature Entities** (SignatureToken, RentalAgreement, DigitalSignature): These entities manage the secure e-signature process for rental agreements. They handle token generation, form data, and capture legally-compliant signature details (IP, user agent, timestamp).

- **Supporting Entities**: Insurance, CollectionsClient, CommunicationLog, Contact, and Workspace entities are used to manage related data and contacts.

### Key Functional Modules

1. **Dashboard**: The main landing page providing a real-time financial overview (Total Invoiced, Paid, Outstanding) and key statistics (Total Cases, Available Bikes).

2. **Cases Management**: The core of the application.
   - List View: A searchable and filterable grid of all cases, showing key details and status.
   - Create/Edit View: A comprehensive form to input and update all case information (NAF/AF details, accident info, financials).
   - Detail View: A consolidated view of a single case, providing access to financials, document uploads, communication logs, and follow-up notes.

3. **Bike Fleet Management**:
   - Manages the inventory of all motorbikes.
   - Includes functionality to assign an available bike to a case and to process a bike's return, which triggers the final rental cost calculation.

4. **Document & E-Signature Module**:
   - Allows admins to upload and manage case-related documents.
   - Features a secure workflow to send documents (like the Rental Agreement) for digital signature. This involves generating a secure, time-limited link, sending it via Email/SMS, and capturing the signature on a dedicated portal.
   - Integrates with JotForm for specific forms, using URL pre-filling and webhooks to retrieve the final signed PDF.

5. **Financials & Collections**:
   - Provides a dedicated financial overview page with monthly and financial-year reporting.
   - Manages outstanding accounts by allowing cases to be assigned to a collections client and facilitating the sending of templated demand letters.

### Critical Business Workflows

1. **New Case Creation**: An admin enters NAF and AF party details. The system generates a unique case number and checks for duplicate vehicle registrations to prevent errors.

2. **Bike Assignment & Rental Calculation**: An available bike is assigned to a case with specified daily rates. The system tracks the number of days the bike is on hire and calculates the total rental cost upon return.

3. **Digital Signature Flow**:
   - Admin initiates a signature request for a case.
   - A unique, secure token (SHA256) is generated.
   - A link containing the token is sent to the client.
   - The client accesses a secure portal, reviews the document, and provides a digital signature.
   - The system captures the signature, IP address, and user agent, then generates a final PDF. This PDF is emailed to the business and stored against the case.

4. **Financial Settlement**: After a bike is returned, the final invoice is calculated. The admin enters the Settlement Agreed amount negotiated with the insurer. Payments are recorded against this amount until the Outstanding balance is zero and the case can be Closed.

### Technical Specifications & Integrations

- **Frontend**: Next.js (React)
- **Backend & Database**: Firebase (Firestore, Authentication, Cloud Functions)
- **Styling**: Tailwind CSS
- **Key External Integrations**:
  - **Brevo** (formerly Sendinblue): For transactional emails and SMS messages.
  - **JotForm**: For handling specific forms via API and webhooks.
  - **Google Drive**: For automatic backup of signed documents.
  - **Stripe**: For internal business subscription management only (not for case payments).

## Code Health Improvement Tasks

Based on the code health analysis, the following tasks should be completed to improve code quality, security, and maintainability:

### 🔴 Critical Priority (Fix Immediately)

#### Security & Configuration
- [ ] **Fix Firebase Security Rules**: Replace open rules in `firestore.rules` and `storage.rules` with proper authentication-based rules
- [ ] **Update npm dependencies**: Run `npm audit fix` to address 3 security vulnerabilities (1 critical, 1 moderate, 1 low)
- [ ] **Add environment validation**: Ensure all required environment variables are validated at startup

#### TypeScript & Build Issues
- [ ] **Fix 28 TypeScript errors**: Address all compilation errors to ensure builds work properly
  - Fix missing type exports and imports (Case, Contact, CaseFrontend types)
  - Resolve type mismatches in case management functions
  - Add missing module declarations
  - Replace unsafe `any` types with proper typing
- [ ] **Fix duplicate object properties**: Resolve object literal duplicate property errors

### 🟡 High Priority (Next Sprint)

#### Code Quality & Logging
- [ ] **Implement structured logging**: Replace 426+ console.log statements with proper logging library
- [ ] **Add error boundaries**: Implement React error boundaries for better error handling
- [ ] **Fix TypeScript unsafe patterns**: Address 68 files with `any`, `unknown`, or TypeScript ignore directives
- [ ] **Standardize error handling**: Create consistent error handling patterns across API routes

#### Testing & Quality Assurance
- [ ] **Expand test coverage**: Current coverage is minimal (3 test files for 175 source files)
  - Add unit tests for core business logic
  - Add integration tests for API endpoints
  - Add component tests for critical UI components
- [ ] **Add code quality tools**: 
  - Configure Prettier for consistent formatting
  - Add additional ESLint rules for code quality
  - Set up pre-commit hooks for code quality checks

### 🟢 Medium Priority (Future Sprints)

#### Performance & Database
- [ ] **Add Firestore indexes**: Define proper indexes in `firestore.indexes.json` for query performance
- [ ] **Optimize React components**: Add memoization where appropriate to prevent unnecessary re-renders
- [ ] **Implement code splitting**: Use dynamic imports for better bundle optimization
- [ ] **Add performance monitoring**: Implement monitoring for slow queries and operations

#### Developer Experience
- [ ] **Add API documentation**: Document all API endpoints with OpenAPI/Swagger
- [ ] **Improve development setup**: Add better onboarding documentation and scripts
- [ ] **Add debugging tools**: Implement better debugging tools for development
- [ ] **Create component documentation**: Document reusable components with Storybook or similar

#### Infrastructure & DevOps
- [ ] **Set up CI/CD pipeline**: Automate testing, linting, and deployment
- [ ] **Add health checks**: Implement application health monitoring
- [ ] **Set up staging environment**: Create proper staging deployment for testing
- [ ] **Add database backups**: Implement automated backup strategy for Firestore

### Completion Tracking
Use this checklist to track progress on code health improvements. Mark items as complete with `[x]` when finished.

**Current Health Score: 6.5/10**
**Target Health Score: 9.0/10**

## 🔥 CRITICAL: Firebase to SQLite Schema Conflicts

### Current State Analysis

The codebase is in a **conflicted state** due to an incomplete migration from Firebase to SQLite. This is causing:

- **47 files still importing Firebase** modules while using SQLite database
- **Mismatched schema definitions** between Firebase schema and SQLite implementation  
- **Type conflicts** causing 28+ TypeScript compilation errors
- **Dual database systems** causing data inconsistency risks

### Schema Conflict Details

#### Current Problematic Files:
- `src/lib/firebase-schema-complete.ts` - Contains SQLite schema but named as Firebase
- `src/lib/case-storage.ts` - Uses SQLite DB but imports Firebase types
- `src/lib/firebase-storage.ts` - Mock file storage system, not using Firebase
- 47+ component files importing Firebase types but connecting to SQLite

#### Architecture Confusion:
1. **Schema File Naming**: `firebase-schema-complete.ts` actually contains SQLite schema definitions
2. **Import Conflicts**: Files import from Firebase packages while using SQLite database
3. **Storage Confusion**: Firebase Storage references but using local file system
4. **Authentication Mixed**: Firebase Auth config exists but SQLite user tables defined

### Complete SQLite Refactor Plan

#### Phase 1: Schema & Database Layer (IMMEDIATE - Day 1)
- [ ] **Rename schema file**: `firebase-schema-complete.ts` → `database-schema.ts`
- [ ] **Remove all Firebase imports** from database layer files
- [ ] **Consolidate database interface**: Create single `DatabaseService` class
- [ ] **Update all schema imports** across 47+ files
- [ ] **Remove Firebase config** from Next.js config and environment

#### Phase 2: Service Layer Refactor (Day 2)
- [ ] **Refactor storage service**: Replace Firebase Storage with local file storage
- [ ] **Update authentication**: Replace Firebase Auth with SQLite-based user management
- [ ] **Consolidate database services**: Merge `case-storage.ts`, `server-storage.ts`, etc.
- [ ] **Remove Firebase dependencies** from package.json
- [ ] **Update API routes** to use SQLite exclusively

#### Phase 3: Component & UI Layer (Day 3)
- [ ] **Update all component imports**: Change Firebase schema imports to database schema
- [ ] **Fix TypeScript errors**: Resolve 28+ compilation errors from schema conflicts
- [ ] **Update form handlers**: Ensure all forms use SQLite data structures
- [ ] **Test data flow**: Verify complete data flow from UI to SQLite

#### Phase 4: Configuration & Cleanup (Day 4)
- [ ] **Remove Firebase rules files**: Delete `firestore.rules`, `storage.rules`, `firebase.json`
- [ ] **Update deployment**: Remove Firebase deployment configuration
- [ ] **Clean up environment**: Remove Firebase environment variables
- [ ] **Update documentation**: Reflect pure SQLite architecture
- [ ] **Final testing**: Comprehensive testing of all features

### Files Requiring Immediate Attention

#### High Priority (Schema Conflicts):
```
src/lib/firebase-schema-complete.ts     → src/lib/database-schema.ts
src/lib/case-storage.ts                 → Update imports
src/lib/firebase-storage.ts             → src/lib/file-storage.ts
src/lib/database.ts                     → Clean up Firebase references
```

#### Medium Priority (47 Component Files):
All files importing Firebase types need import updates:
- Case management components (15 files)
- Fleet management components (8 files) 
- Document handling components (12 files)
- API routes (12 files)

### Migration Script Strategy

Create automated migration scripts:
1. **Schema rename script**: Rename and update all imports
2. **Firebase cleanup script**: Remove all Firebase references
3. **TypeScript fix script**: Resolve compilation errors
4. **Test validation script**: Ensure all features work post-migration

### Risk Mitigation

- **Data backup**: Backup current SQLite database before migration
- **Feature testing**: Test each major feature after each phase
- **Rollback plan**: Maintain ability to rollback if issues arise
- **Documentation**: Document every change for future reference

### Success Criteria

✅ **Zero Firebase imports** in codebase  
✅ **All TypeScript errors resolved**  
✅ **Single database system** (SQLite only)  
✅ **All features functional** with SQLite  
✅ **Clean architecture** with proper separation  

This refactor will resolve the current schema conflicts and establish a clean, maintainable SQLite-based architecture.