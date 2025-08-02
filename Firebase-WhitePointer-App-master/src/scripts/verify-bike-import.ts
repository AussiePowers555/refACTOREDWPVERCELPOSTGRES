import { DatabaseService } from '@/lib/database';
import type { BikeFrontend } from '@/lib/database-schema';

async function verifyBikeImport() {
  try {
    console.log('🚲 Verifying bike import...');
    
    // Get all bikes from database
    const dbBikes = await DatabaseService.getBikes();
    console.log(`Database contains ${dbBikes.length} bikes`);

    // Verification checks
    const issues = {
      missingFields: 0,
      invalidStatus: 0,
      rateMismatch: 0
    };

    dbBikes.forEach(bike => {
      // Check required fields
      if (!bike.make || !bike.model || !bike.registration) {
        issues.missingFields++;
        console.warn(`⚠️ Missing fields for bike ${bike.id}`);
      }

      // Validate status
      const validStatuses = ['available', 'assigned', 'maintenance', 'retired'];
      if (!validStatuses.includes(bike.status.toLowerCase())) {
        issues.invalidStatus++;
        console.warn(`⚠️ Invalid status for bike ${bike.id}: ${bike.status}`);
      }

      // Check rate consistency
      if (bike.dailyRate && bike.dailyRate <= 0) {
        issues.rateMismatch++;
        console.warn(`⚠️ Invalid daily rate for bike ${bike.id}: ${bike.dailyRate}`);
      }
    });

    console.log('✅ Verification complete:');
    console.log(`- Missing fields: ${issues.missingFields}`);
    console.log(`- Invalid status: ${issues.invalidStatus}`);
    console.log(`- Rate issues: ${issues.rateMismatch}`);
    
    return {
      success: true,
      totalBikes: dbBikes.length,
      ...issues
    };
    
  } catch (error) {
    console.error('❌ Error verifying bike import:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

// Run verification
verifyBikeImport().then(result => {
  if (!result.success) process.exit(1);
});