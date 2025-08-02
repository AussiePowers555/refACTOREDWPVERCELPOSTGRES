import { DatabaseService } from '../src/lib/database';

export function logDatabaseError(
  error: any,
  operation: string,
  table: string,
  data?: any
) {
  console.error(`[DB ERROR] Operation: ${operation}, Table: ${table}`);
  console.error(`[DB ERROR] Code: ${error.code}, Message: ${error.message}`);
  console.error('[DB ERROR] Stack:', error.stack);
  
  if (data) {
    console.error('[DB ERROR] Data:', JSON.stringify(data, null, 2));
  }
  
  // Log the database configuration
  console.error('[DB ERROR] Database file:', process.env.DATABASE_PATH || 'data/pbike-rescue.db');
  console.error('[DB ERROR] Database service available:', !!DatabaseService);
}
