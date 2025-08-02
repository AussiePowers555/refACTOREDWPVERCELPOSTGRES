// PostgreSQL database implementation for Vercel deployment
export * from './database-postgres';

// For backward compatibility, re-export the service
export { DatabaseService as default } from './database-postgres';

// Legacy support - redirect old sqlite calls to postgres
export const db = null; // Not used in PostgreSQL version