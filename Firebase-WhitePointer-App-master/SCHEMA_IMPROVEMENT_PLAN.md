# Database Schema Improvement Plan

This document outlines the necessary changes to improve the database schema's integrity and consistency.

## 1. Add Foreign Key Constraints to `cases` table

The `cases` table should have foreign key constraints for `workspace_id`, `assigned_lawyer_id`, and `assigned_rental_company_id`.

```sql
CREATE TABLE IF NOT EXISTS cases (
  -- ... existing columns
  FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_lawyer_id) REFERENCES contacts (id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_rental_company_id) REFERENCES contacts (id) ON DELETE SET NULL
);
```

## 2. Add `ON DELETE CASCADE` to `workspaces` and `user_accounts`

The `workspaces` and `user_accounts` tables should have `ON DELETE CASCADE` for their foreign key constraints to ensure that related records are deleted when a contact is deleted.

### `workspaces` table

```sql
CREATE TABLE IF NOT EXISTS workspaces (
  -- ... existing columns
  FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
);
```

### `user_accounts` table

```sql
CREATE TABLE IF NOT EXISTS user_accounts (
  -- ... existing columns
  FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE SET NULL
);
```

## 3. Remove Redundant `deleteAllCases` Function

The `deleteAllCases` function in `DatabaseService` is no longer needed and should be removed.

## 4. Standardize ID Generation

The `createCase` and `createContact` functions should use a consistent method for generating IDs. We will use the `randomUUID` function from the `crypto` module.

## 5. Add `type` to `workspaces` table

The `workspaces` table should have a `type` column to distinguish between different types of workspaces.

```sql
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  type TEXT, -- "Lawyer" or "Rental Company"
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
);