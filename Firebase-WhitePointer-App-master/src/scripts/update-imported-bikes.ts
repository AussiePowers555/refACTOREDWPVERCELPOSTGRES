import { writeFileSync } from 'fs';
import { importedBikes } from '../data/imported-bikes';
import type { Bike } from '../types/bike';

const updatedBikes: Bike[] = importedBikes.map(bike => ({
  ...bike,
  serviceCenterContactId: bike.serviceCenterContactId || '',
  dailyRateA: bike.dailyRateA || 85,
  dailyRateB: bike.dailyRateB || 95,
  assignedCaseId: bike.assignedCaseId || '',
  assignmentStartDate: bike.assignmentStartDate || '',
  assignmentEndDate: bike.assignmentEndDate || ''
}));

const fileContent = `import { Bike } from '@/types/bike';

export const importedBikes: Bike[] = ${JSON.stringify(updatedBikes, null, 2)};
`;

try {
  writeFileSync('./src/data/imported-bikes.ts', fileContent);
  console.log('✅ Successfully updated imported-bikes.ts with new fields');
  console.log(`📊 Updated ${updatedBikes.length} bikes with new Daily Rate A/B and Service Center Contact fields`);
  
  // Verify the update
  updatedBikes.forEach((bike, index) => {
    if (index < 3) { // Show first 3 bikes as sample
      console.log(`Bike ${bike.id}: ${bike.make} ${bike.model} - Daily Rate A: $${bike.dailyRateA}, Daily Rate B: $${bike.dailyRateB}`);
    }
  });
  
} catch (error) {
  console.error('❌ Error updating imported-bikes.ts:', error);
}