import { DatabaseService, db, ensureDatabaseInitialized } from '../../src/lib/database';

export async function logDatabaseHealth() {
  try {
    console.log('[DB HEALTH] Checking database connection...');
    
    // 1. Verify database initialization
    ensureDatabaseInitialized();
    console.log(`[DB HEALTH] Database service available: ${!!DatabaseService}`);
    
    // 2. Verify tables exist by checking if we can query
    if (typeof window === 'undefined' && db) {
      try {
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log('[DB HEALTH] Tables:', tables.map((t: any) => t.name));
        
        // 3. Verify case table structure
        const caseColumns = db.prepare("PRAGMA table_info(cases)").all();
        console.log(`[DB HEALTH] Cases table has ${caseColumns.length} columns`);
        
        // 4. Verify basic query
        const testQuery = db.prepare('SELECT 1 + 1 AS result').get();
        console.log('[DB HEALTH] Test query result:', testQuery);
      } catch (dbError) {
        console.error('[DB HEALTH] Database query error:', dbError);
      }
    }
    
    // 5. Try to get cases to verify service is working
    try {
      const caseCount = DatabaseService.getAllCases().length;
      console.log(`[DB HEALTH] Found ${caseCount} cases in database`);
    } catch (e) {
      console.log('[DB HEALTH] Error getting cases:', e);
    }
    
    console.log('[DB HEALTH] Database connection check complete');
  } catch (error: unknown) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('[DB HEALTH ERROR]', error);
    throw new Error(`Database health check failed: ${errorMessage}`);
  }
}
