# Motorbike Rental Management System - Sequential Build Task List

This document provides a detailed, sequential task list for building the Motorbike Rental Management System. Follow these phases and steps in order. Refer to `Mega Prompt Motirbike Rental2.txt` for all detailed specifications.

---

## Phase 1: Project Scaffolding & Firebase Setup

**Objective**: Prepare the foundational structure of the application and connect it to backend services.

- [ ] **Task 1.1: Initialize Next.js Project**
  - [ ] Use `create-next-app` to scaffold a new Next.js 14 project.
  - [ ] Select options for TypeScript, Tailwind CSS, and the App Router.
  - [ ] Initialize a new Git repository.

- [ ] **Task 1.2: Install & Configure Dependencies**
  - [ ] Install `shadcn/ui` and initialize it.
  - [ ] Install `firebase` for connecting to Firebase services.
  - [ ] Install `zod` for schema validation and `react-hook-form` with `@hookform/resolvers` for form management.
  - [ ] Install `zustand` for state management.
  - [ ] Install `react-signature-canvas` for digital signatures.

- [ ] **Task 1.3: Set up Firebase Project**
  - [ ] Create a new project in the Firebase Console.
  - [ ] Create a new Web App within the project.
  - [ ] Enable **Firestore**, **Firebase Authentication** (with Email/Password provider), and **Firebase Storage**.

- [ ] **Task 1.4: Configure Firestore Security Rules**
  - [ ] Open the Firestore security rules in the Firebase Console.
  - [ ] Copy and paste the skeleton rules from `Section 7.3` of the mega prompt.
  - [ ] Deploy the initial rules.

- [ ] **Task 1.5: Create Environment File**
  - [ ] Create a `.env.local` file in the project root.
  - [ ] Copy the Firebase configuration keys from the Firebase Console into the `.env.local` file, using the template from `Section 8.1` of the mega prompt.
  - [ ] Add placeholders for `JOTFORM_API_KEY`, `BREVO_API_KEY`, and `STRIPE_SECRET_KEY`.

---

## Phase 2: Data Layer & Core Models

**Objective**: Define the application's data structures and create the necessary functions to interact with Firestore.

- [ ] **Task 2.1: Implement Firestore Models with Zod**
  - [ ] Create a `src/lib/schemas` directory.
  - [ ] For each data model in `Section 5` of the mega prompt (Case, Bike, Contact, etc.), create a Zod schema in a separate file (e.g., `case.schema.ts`).

- [ ] **Task 2.2: Create CRUD Utility Functions**
  - [ ] Create a `src/lib/firebase/firestore.ts` file.
  - [ ] Implement generic or specific functions for `get`, `add`, `update`, and `delete` operations for each collection (e.g., `addCase`, `getBike`).

- [ ] **Task 2.3: Implement Case Number Generation Logic**
  - [ ] Create a utility function that generates a case number in the `WWMM###` format as specified in the mega prompt. This will involve querying Firestore for the last sequence number for the current week/month.

---

## Phase 3: Authentication & UI Shell

**Objective**: Build the user authentication flow and the main application layout.

- [ ] **Task 3.1: Set up Firebase Authentication**
  - [ ] Create a `src/lib/firebase/auth.ts` file to wrap Firebase Auth functions.
  - [ ] Build a login page (`/login`) with a form for email and password.
  - [ ] Implement the sign-in, sign-out, and session observer logic.

- [ ] **Task 3.2: Build Main Application Layout**
  - [ ] Create a main layout component in `src/app/layout.tsx`.
  - [ ] Build a persistent sidebar component for navigation and a header component.

- [ ] **Task 3.3: Implement Protected Routes**
  - [ ] Create a higher-order component or use middleware to protect all routes except `/login` and `/secure-signature-portal/*`.
  - [ ] Redirect unauthenticated users to the `/login` page.

- [ ] **Task 3.4: Build Navigation & Workspace Indicator**
  - [ ] Populate the sidebar with navigation links to all main modules (Dashboard, Cases, Bikes, etc.).
  - [ ] In the header, add a component to display the currently active workspace and a button to clear it.

---

## Phase 4: Core Modules (Cases, Bikes, Contacts, Workspaces)

**Objective**: Build the primary data management modules of the application.

- [ ] **Task 4.1: Build Cases Module**
  - [ ] **List View (`/cases`):** Implement the card-based layout, search bar, and filters.
  - [ ] **Create Page (`/cases/create`):** Build the multi-section form using `react-hook-form` and the Zod schema.
  - [ ] **View Page (`/cases/[caseId]`):** Build the detailed, multi-panel view with all related information cards (Financials, Bike, Documents, etc.).
  - [ ] **Edit Page (`/cases/[caseId]/edit`):** Reuse the create form, pre-populated with case data.

- [ ] **Task 4.2: Build Bikes Module**
  - [ ] **List View (`/bikes`):** Create the table view with status color-coding.
  - [ ] **Create/Edit Forms:** Build the forms for adding and updating bike details.
  - [ ] **Assign/Return Logic:** Implement the functionality to link a bike to a case and later mark it as returned.

- [ ] **Task 4.3: Build Contacts Module (`/contacts`)**
  - [ ] Build a simple CRUD interface for managing a central list of all contacts (Clients, Lawyers, etc.).

- [ ] **Task 4.4: Build Workspaces Module (`/workspaces`)**
  - [ ] Build the interface to create and manage workspaces, linking them to a contact.
  - [ ] Implement the global state (Zustand) to manage the active workspace.
  - [ ] Implement the special "Main Workspace" logic that clears the workspace filter.

---

## Phase 5: Financial & Collections Modules

**Objective**: Implement the financial tracking and collections features.

- [ ] **Task 5.1: Build Financial Dashboard (`/dashboard`)**
  - [ ] Create the financial overview panel and statistics cards.
  - [ ] Implement the logic to calculate metrics for the current month and financial year.

- [ ] **Task 5.2: Implement Real-time Financial Fields**
  - [ ] On the Case View page, make the financial fields (Invoiced, Reserve, etc.) editable.
  - [ ] Implement on-blur saving logic that updates the Firestore document in real-time.

- [ ] **Task 5.3: Build Collections Module (`/collections`)**
  - [ ] Build the CRUD interface for managing collections clients.
  - [ ] Create the demand email generation interface within the Case View page.

---

## Phase 6: Document Management & Digital Signatures

**Objective**: Build the file handling and secure document signing workflows.

- [ ] **Task 6.1: Implement File Uploads to Firebase Storage**
  - [ ] In the Documents section of the Case View page, add a file input.
  - [ ] On upload, save the file to a case-specific folder in Firebase Storage and create a corresponding `Document` record in Firestore.

- [ ] **Task 6.2: Build Digital Signature Portal (`/secure-signature-portal/[token]`)**
  - [ ] Create this public-facing page.
  - [ ] Implement the server-side logic to validate the token from the URL.
  - [ ] Display the relevant form data in a read-only format.

- [ ] **Task 6.3: Implement Signature Capture**
  - [ ] Add the `react-signature-canvas` component to the signature portal.
  - [ ] On submission, capture the signature as a Base64 PNG.

- [ ] **Task 6.4: Build Form Components**
  - [ ] Create all form components (`AuthorityToActForm`, `ClaimsForm`, etc.) as defined in `Section 6.2` of the mega prompt.
  - [ ] Place them in `src/components/forms/`.

---

## Phase 7: External Integrations (JotForm, Brevo)

**Objective**: Connect the application to third-party services.

- [ ] **Task 7.1: Create JotForm Webhook Receiver**
  - [ ] Create a new API Route (`/api/webhooks/jotform`).
  - [ ] This endpoint will receive the `submissionID` from JotForm.

- [ ] **Task 7.2: Implement JotForm API Client**
  - [ ] Create a server-side function to call the JotForm API.
  - [ ] Use the `submissionID` to download the signed PDF and save it to Firebase Storage.

- [ ] **Task 7.3: Implement Brevo API Client**
  - [ ] Create a server-side function to send emails and SMS via the Brevo API.
  - [ ] Use this for sending signature links and other transactional messages.

---

## Phase 8: Finalization, Testing & Deployment

**Objective**: Polish the application, ensure its quality, and deploy it to production.

- [ ] **Task 8.1: UI/UX Polish**
  - [ ] Perform a full review of the application, ensuring all components are responsive.
  - [ ] Implement the light/dark mode toggle and ensure it's persistent.

- [ ] **Task 8.2: Write Tests**
  - [ ] Write unit tests for critical utility functions (e.g., case number generation, financial calculations).
  - [ ] Write integration tests for the main user flows (e.g., creating a case, signing a document).

- [ ] **Task 8.3: Prepare for Deployment**
  - [ ] Ensure the build process runs without errors (`npm run build`).
  - [ ] Set up a new project on Vercel and link the Git repository.

- [ ] **Task 8.4: Configure Production Environment Variables**
  - [ ] In the Vercel project settings, add all the environment variables from `.env.local` with their production values.
  - [ ] Trigger the first production deployment.
