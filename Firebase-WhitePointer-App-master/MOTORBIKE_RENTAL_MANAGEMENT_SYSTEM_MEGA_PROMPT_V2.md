# MOTORBIKE RENTAL MANAGEMENT SYSTEM - COMPREHENSIVE SPECIFICATION V2
## One-Shot Rebuild Prompt for LLM

### SYSTEM OVERVIEW
Build a comprehensive web-based motorbike rental management system for White Pointer, a company specializing in motorcycle rentals for not-at-fault accident victims in Australia. The system manages cases, fleet, finances, communications, and document workflows with integrated digital signatures.

### TECHNOLOGY STACK
- **Frontend**: Next.js 15.3.3 with TypeScript, React 18, Turbopack
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Database**: SQLite with better-sqlite3 (fallback to localStorage for development)
- **Backend Storage**: Firebase/Firestore (with local fallbacks)
- **Authentication**: Custom JWT-based with role-based access control
- **PDF Generation**: React-PDF
- **Email Service**: Brevo (SendinBlue) API
- **Form Integration**: JotForm API with webhook support
- **File Storage**: Local filesystem with Firebase Storage backup

### DATABASE SCHEMA

#### Core Entities:

1. **Cases** (Primary Entity)
   - ID, case_number (format: CASE-######)
   - Status progression: New Matter → Customer Contacted → Awaiting Approval → Bike Delivered → Bike Returned → Demands Sent → Awaiting Settlement → Settlement Agreed → Paid → Closed
   - Not-at-fault (NAF) party details: name, phone, email, address, suburb, state, postcode, DOB, licence details, claim number, insurance company, vehicle details
   - At-fault (AF) party details: same fields as NAF
   - Assignments: lawyer_id, rental_company_id, bike_id
   - Financial summary: invoiced, reserve, agreed, paid
   - Accident details: date, time, description, location, diagram
   - Timestamps: created_date, modified_date, last_updated

2. **Contacts**
   - Types: Client, Lawyer, Insurer, Repairer, Rental Company, Service Center, Other
   - Fields: name, company, type, phone, email, address, notes

3. **Bikes** (Fleet Management)
   - Registration, make, model, year, color, VIN
   - Status: available, assigned, maintenance, retired
   - Assignment details: case_number, start_date, end_date
   - Location tracking, service_center_id
   - Daily rates and additional fees

4. **User Accounts**
   - Roles: admin, developer, lawyer, rental_company, workspace_user
   - Status: active, pending_password_change, disabled
   - Linked to contact_id for role-based access

5. **Documents**
   - Types: claims, not-at-fault-rental, certis-rental, authority-to-act, direction-to-pay, signed-agreement
   - File management with signatures, versioning, encryption

6. **Financial Records**
   - Per-case financial tracking
   - Invoice amounts, settlements, payments, outstanding balances

7. **Communication Logs**
   - Types: Email, Phone, SMS, Letter, Meeting, Other
   - Direction: inbound/outbound
   - Priority levels, follow-up tracking

8. **Commitments**
   - Case-based deadlines and tasks
   - Due dates, notes, status tracking

9. **Workspaces**
   - Organization units for lawyers/rental companies
   - Main Workspace shows all cases
   - Regular workspaces filter by assignment

### GUI COMPONENTS & LAYOUTS

#### 1. **Login Page** (`/login`)
- Clean centered card design
- Email/password fields with validation
- "Remember me" checkbox
- Error messaging for failed attempts
- Redirects to dashboard on success

#### 2. **Main Layout** (Sidebar Navigation)
- **Logo**: PBikeRescue with bike icon
- **Main Navigation**:
  - Dashboard (home icon)
  - Workspaces (grid icon) - admin only
  - Case Management (briefcase icon)
  - Fleet Tracking (bike icon) - admin only
  - Financials (banknote icon) - admin only
  - Commitments (clipboard icon) - admin only
  - Contacts (contact icon) - admin only
  - Documents (file icon)
  - Interactions (message icon)
  - AI Email (mail icon) - admin only
- **Settings Section**:
  - User Management (shield icon) - admin only
  - Subscriptions (gem icon) - admin only
  - Settings (gear icon)
- **User Header**: Shows current user email and logout button

#### 3. **Dashboard** (`/`)
- **KPI Cards** (4-column grid):
  - Total Cases (count + trend)
  - Bikes Available (X/Y format + percentage)
  - Overdue Payments (amount + case count)
  - Active Insurance Claims (count + status)
- **Recent Cases Table**:
  - Columns: Case Number, Client, Assigned Lawyer, Assigned Rental Company, Status, Last Updated
  - Status badges with color coding
  - Clickable rows for case details
- **Fleet Status Chart**:
  - Vertical bar chart showing Available, Rented, Maintenance counts
  - Interactive tooltips

#### 4. **Case List** (`/cases`)
- **Header**: "Case List" title + "New Case" button
- **Search Bar**: Global search across all case fields
- **Filter Pills**: Active workspace shown as removable pill
- **Results Count**: "Showing X of Y cases"
- **Sortable Table Headers**:
  - Case Number, NAF Client, Status, Last Updated
  - Sort indicators (up/down arrows)
- **Expandable Rows** showing:
  - Contact details (phone, email, address)
  - At-fault party information
  - Insurance details
  - Assigned lawyer/rental company dropdowns
  - Financial summary (Invoiced, Reserve, Agreed, Paid)
  - Action buttons: View Details, Communications Log, Delete
- **Mock Data Button**: Create 5 sample cases (dev mode)

#### 5. **Case Detail** (`/cases/[caseId]`)
- **Back Navigation**: Arrow + "Back to Case List"
- **Header**: Case number + status badge
- **Tab Navigation**:
  - Details | Gallery | PDFs | Upload
- **Details Tab**:
  - Editable form sections:
    - Not-at-Fault Party Details
    - At-Fault Party Details  
    - Accident Information
    - Case Assignments
    - Financial Summary
  - Save/Cancel buttons
- **Gallery Tab**: Image grid with lightbox viewer
- **PDFs Tab**: Document list with inline viewer
- **Upload Tab**: Drag-drop file upload area
- **Sidebar Cards**:
  - Assigned Bike (if any)
  - Communication Log
  - AI Email Generator

#### 6. **Fleet Page** (`/fleet`)
- **Search Bar**: Filter bikes by registration/details
- **Bike Cards** (responsive grid):
  - Image placeholder
  - Registration, Make/Model, Year
  - Status badge (color-coded)
  - Location display
  - Daily rate
  - Assignment info (if assigned)
  - Action buttons:
    - Edit, Assign to Case (if available)
    - Return Bike (if assigned)
    - Prepare Agreement (if assigned)
    - Service Center dropdown
    - Delete (with confirmation)

#### 7. **Financials** (`/financials`)
- **Summary Cards**: Total Outstanding, Total Paid, Average Case Value
- **Financial Table**:
  - Columns: Case, Client, Invoiced, Agreed, Paid, Outstanding, Status
  - Sorting and filtering options
  - Export to CSV functionality

#### 8. **Commitments** (`/commitments`)
- **Calendar View**: Monthly calendar with commitment markers
- **List View**: 
  - Grouped by date
  - Case number, note, due date
  - Mark complete functionality
- **Add Commitment**: Modal with case selector, date picker, note field

#### 9. **Contacts** (`/contacts`)
- **Contact Type Tabs**: All, Lawyers, Rental Companies, Service Centers, etc.
- **Contact Cards**:
  - Name, company, type badge
  - Contact details (phone, email)
  - Notes section
  - Edit/Delete actions
- **Add Contact Modal**: Form with type-specific fields

#### 10. **Documents** (`/documents`)
- **Document Grid**: 
  - File type icons
  - Filename, size, upload date
  - Case association
  - Download/View/Delete actions
- **Upload Area**: Drag-drop with case selection

#### 11. **AI Email Generator** (`/ai-email`)
- **Template Selector**: Dropdown for email types
- **Context Fields**: Case number, recipient selection
- **Prompt Input**: Text area for AI instructions
- **Generated Content**: Preview area with edit capability
- **Send Options**: Direct send or copy to clipboard

### FORM WORKFLOWS

#### 1. **New Case Form**
- Multi-section form with validation:
  - Basic Information (rental company, lawyer)
  - NAF Party Details
  - AF Party Details
  - Save & Close functionality

#### 2. **JotForm Integration**
- **Authority to Act Form**: 
  - Pre-filled from case data
  - Signature capture
  - PDF generation on submission
- **Claims Form**:
  - Comprehensive accident details
  - Multiple party information
  - Document upload capability
- **Webhook Processing**: Auto-update cases on form submission

#### 3. **Digital Signature Workflow**
1. Generate secure token with expiry
2. Send email with signing link
3. Capture signature via SignaturePad component
4. Generate signed PDF
5. Store encrypted in database
6. Update case status

### BUSINESS LOGIC & RULES

#### 1. **Case Management**
- Auto-generate case numbers (CASE-######)
- Enforce status progression rules
- Calculate financial summaries automatically
- Track all changes with timestamps

#### 2. **Access Control**
- **Admin/Developer**: Full system access
- **Lawyer**: Access to assigned cases only
- **Rental Company**: Access to assigned cases only
- **Workspace User**: Limited to workspace cases

#### 3. **Fleet Management**
- Prevent double-booking of bikes
- Auto-calculate rental periods and costs
- Track maintenance schedules
- Generate rental agreements with terms

#### 4. **Financial Tracking**
- Auto-calculate outstanding amounts
- Track payment history
- Generate invoice summaries
- Alert on overdue payments

#### 5. **Communication Tracking**
- Log all communications with timestamps
- Set follow-up reminders
- Priority-based sorting
- Email template system

### API ENDPOINTS

#### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/change-password` - Password change

#### Cases
- GET `/api/cases` - List cases (filtered by user role)
- POST `/api/cases` - Create new case
- GET `/api/cases/[id]` - Get case details
- PUT `/api/cases/[id]` - Update case
- DELETE `/api/cases/[id]/delete` - Delete case

#### Fleet
- GET `/api/bikes` - List all bikes
- POST `/api/bikes` - Add new bike
- PUT `/api/bikes/[id]` - Update bike
- DELETE `/api/bikes/[id]` - Delete bike

#### Documents
- POST `/api/documents/send-for-signature` - Initiate signing
- GET `/api/signature/validate-token` - Validate signing token
- POST `/api/signature/submit` - Submit signature

#### Forms
- GET `/api/forms/[type]/[token]` - Get pre-filled form
- POST `/api/forms/[type]/[token]/submit` - Submit form
- POST `/api/webhooks/jotform` - JotForm webhook

#### Communications
- POST `/api/send-test-email` - Email testing
- POST `/api/send-test-sms` - SMS testing

### SECURITY FEATURES

1. **Authentication**
   - JWT tokens with expiry
   - Secure password hashing
   - Session management

2. **Data Protection**
   - Encrypted signature storage
   - Secure token generation
   - IP logging for signatures

3. **Access Control**
   - Role-based permissions
   - Workspace isolation
   - Contact-based filtering

4. **Document Security**
   - SHA256 hash verification
   - Version tracking
   - Audit trails

### RESPONSIVE DESIGN

- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly interfaces
- Optimized table views for small screens
- Card-based layouts for better mobile UX

### ERROR HANDLING

1. **User-Friendly Messages**
   - Clear error descriptions
   - Suggested actions
   - Contact support options

2. **Fallback Mechanisms**
   - Local storage when database unavailable
   - Cached data for offline viewing
   - Queue system for failed operations

3. **Validation**
   - Frontend form validation
   - Backend data validation
   - Business rule enforcement

### TESTING REQUIREMENTS

1. **Unit Tests**
   - Component testing
   - API endpoint testing
   - Business logic validation

2. **Integration Tests**
   - Form submission workflows
   - Document signing process
   - Payment calculations

3. **E2E Tests**
   - Complete user journeys
   - Multi-role scenarios
   - Error recovery paths

### DEPLOYMENT CONFIGURATION

1. **Environment Variables**
   ```
   DATABASE_URL
   NEXTAUTH_SECRET
   BREVO_API_KEY
   JOTFORM_API_KEY
   FIREBASE_CONFIG
   ```

2. **Build Process**
   - TypeScript compilation
   - Asset optimization
   - Environment-specific configs

3. **Monitoring**
   - Error tracking
   - Performance metrics
   - User analytics

This specification provides a complete blueprint for rebuilding the motorbike rental management system with all GUI components, business logic, and technical requirements clearly defined.