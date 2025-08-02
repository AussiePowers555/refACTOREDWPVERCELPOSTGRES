import { DatabaseService, db, ensureDatabaseInitialized } from '../src/lib/database';

export async function logDatabaseHealth() {
  try {
    console.log('[DB HEALTH] Checking database connection...');
    
    // 1. Verify database initialization
    ensureDatabaseInitialized();
    console.log(`[DB HEALTH] Database service available: ${!!DatabaseService}`);
    
    // 2. Try to get cases to verify database is working
    try {
      const caseCount = DatabaseService.getAllCases().length;
      console.log(`[DB HEALTH] Found ${caseCount} cases in database`);
    } catch (e) {
      console.log('[DB HEALTH] Error getting cases:', e);
    }
    
    // 3. Check if db is initialized
    console.log(`[DB HEALTH] Database object available: ${!!db}`);
    
    console.log('[DB HEALTH] Database connection check complete');
  } catch (error: any) {
    console.error('[DB HEALTH ERROR]', error);
    throw new Error(`Database health check failed: ${error.message || 'Unknown error'}`);
  }
}
