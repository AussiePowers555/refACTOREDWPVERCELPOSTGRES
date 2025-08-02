# Bug Report & Task List

This document tracks all known bugs and the refactoring tasks required to get the application working reliably with SQLite.

## Priority 1: Refactoring & Abstraction

- [x] **Database-Specific Logic in API Routes:** API routes like `api/cases/by-number/[caseNumber]/route.ts` contained Firebase-specific code. This has been fixed.

- [ ] **Incomplete SQLite Service:** The `sqlite-service.ts` is likely not fully implemented. This needs a full review.

## Priority 2: TypeScript & Runtime Errors

- [x] **Missing `await` keywords:** Multiple files were missing `await` for async database calls. This has been fixed in `lib/actions.ts`, `lib/case-storage.ts`, and `app/api/` routes.

- [ ] **Weak Typing in Database Service:** The `DatabaseService` proxy uses `any` for its method signatures, which disables TypeScript's type checking and causes downstream errors, like in `api/users/route.ts`.
  - **Fix:** Update `database.ts` to use proper interfaces (e.g., `UserAccount`, `Case`) instead of `any`.

- [ ] **Firebase Admin Module Errors:** The application still reports errors like `Cannot find module 'firebase-admin/firestore'`. This needs investigation.

## Task List

1.  **[COMPLETED]** Abstract Firebase-specific logic from API routes.
2.  **[COMPLETED]** Fix missing `await` keywords in `lib` and `app/api` files.
3.  **[IN PROGRESS]** Strengthen types in `database.ts` to resolve downstream TypeScript errors.
4.  **[TODO]** Review and complete `sqlite-service.ts`.
5.  **[TODO]** Resolve Firebase Admin module errors.

---
*Signed: Cascade, Windsurf Kilo Coderies* 
