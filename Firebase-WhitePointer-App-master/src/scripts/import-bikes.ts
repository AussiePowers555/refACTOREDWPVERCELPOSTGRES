import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { BikeFrontend } from '../lib/database-schema';

// Function to generate unique bike ID
function generateBikeFrontendId(index: number): string {
  return `M${(1000 + index).toString()}`;
}

// Function to parse date from DD/MM/YYYY or YYYY-MM-DD format
function parseDate(dateStr: string): string {
  if (!dateStr || dateStr === 'N/A') return '';
  
  // Handle DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Already in YYYY-MM-DD format
  return dateStr;
}

export function importBikeFrontendsFromCSV(csvFilePath: string): BikeFrontend[] {
  try {
    // Read the CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Parse CSV content
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    // Convert CSV records to BikeFrontend objects
    const bikes: BikeFrontend[] = records.map((record: any, index: number) => {
      const bike: BikeFrontend = {
        id: generateBikeFrontendId(index + 1),
        make: record.Make || '',
        model: record.Model || '',
        registration: record.Registration || '',
        registrationExpires: parseDate(record['Last Registration Date']) || '',
        serviceCenter: '',
        deliveryStreet: '',
        deliverySuburb: '',
        deliveryState: '',
        deliveryPostcode: '',
        lastServiceDate: parseDate(record['Last Service Date']) || '',
        serviceNotes: '',
        status: 'available',
        location: 'Main Warehouse',
        dailyRate: 85.00, // Default daily rate
        imageUrl: 'https://placehold.co/300x200.png',
        imageHint: 'motorcycle sport',
        assignment: record['Last Known Case Assigned'] === 'None' ? '-' : (record['Last Known Case Assigned'] || '-')
      };
      
      return bike;
    });
    
    console.log(`Successfully imported ${bikes.length} bikes from CSV`);
    return bikes;
    
  } catch (error) {
    console.error('Error importing bikes from CSV:', error);
    throw error;
  }
}

// Function to export bikes for use in the app
export function generateBikeFrontendsArray(): string {
  const csvPath = path.join(process.cwd(), '..', '..', 'Template Data Real', 'bike_inventory_20250729_061104.csv');
  const bikes = importBikeFrontendsFromCSV(csvPath);
  
  return `export const importedBikeFrontends: BikeFrontend[] = ${JSON.stringify(bikes, null, 2)};`;
}

// If running as a script
if (require.main === module) {
  const csvPath = process.argv[2] || path.join(process.cwd(), '..', '..', '..', 'Template Data Real', 'bike_inventory_20250729_061104.csv');
  console.log('Importing bikes from:', csvPath);
  
  const bikes = importBikeFrontendsFromCSV(csvPath);
  
  // Write the bikes to a TypeScript file that can be imported
  const outputPath = path.join(process.cwd(), '..', 'data', 'imported-bikes.ts');
  const content = `import { BikeFrontend } from '@/types/bike';

export const importedBikeFrontends: BikeFrontend[] = ${JSON.stringify(bikes, null, 2)};
`;
  
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content);
  
  console.log(`BikeFrontends exported to: ${outputPath}`);
}