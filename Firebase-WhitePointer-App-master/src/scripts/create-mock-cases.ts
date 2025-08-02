import { CaseFrontend } from '../lib/database-schema';

const mockCases: Omit<CaseFrontend, 'id'>[] = [
  {
    caseNumber: `CASE-${Date.now().toString().slice(-6)}01`,
    status: 'Paid',
    lastUpdated: 'Just now',
    clientName: 'Sarah Mitchell',
    clientPhone: '0412 345 678',
    clientEmail: 'sarah.mitchell@email.com',
    clientStreetAddress: '45 Collins Street',
    clientSuburb: 'Melbourne',
    clientState: 'VIC',
    clientPostcode: '3000',
    clientClaimNumber: 'CLM-2025-0142',
    clientInsuranceCompany: 'AAMI',
    clientVehicleRego: 'VIC789',
    atFaultPartyName: 'James Wilson',
    atFaultPartyPhone: '0423 456 789',
    atFaultPartyEmail: 'j.wilson@email.com',
    atFaultPartyStreetAddress: '123 Swanston Street',
    atFaultPartySuburb: 'Carlton',
    atFaultPartyState: 'VIC',
    atFaultPartyPostcode: '3053',
    atFaultPartyClaimNumber: 'AF-2025-8934',
    atFaultPartyInsuranceCompany: 'Allianz',
    atFaultPartyVehicleRego: 'MEL456',
    
    
    invoiced: 4500,
    reserve: 4000,
    agreed: 0,
    paid: 0,
    accidentDate: '2025-01-28',
    accidentTime: '09:30',
    accidentDescription: 'Rear-end collision at traffic lights on Collins Street. Client was stationary when hit from behind.'
  },
  {
    caseNumber: `CASE-${Date.now().toString().slice(-6)}02`,
    status: 'Settlement Agreed',
    lastUpdated: 'Just now',
    clientName: 'Michael Chen',
    clientPhone: '0498 765 432',
    clientEmail: 'mchen88@email.com',
    clientStreetAddress: '78 George Street',
    clientSuburb: 'Sydney',
    clientState: 'NSW',
    clientPostcode: '2000',
    clientClaimNumber: 'NSW-CLM-5678',
    clientInsuranceCompany: 'NRMA',
    clientVehicleRego: 'NSW123',
    atFaultPartyName: 'Rebecca Thompson',
    atFaultPartyPhone: '0411 222 333',
    atFaultPartyEmail: 'rebecca.t@email.com',
    atFaultPartyStreetAddress: '250 Pitt Street',
    atFaultPartySuburb: 'Sydney',
    atFaultPartyState: 'NSW',
    atFaultPartyPostcode: '2000',
    atFaultPartyClaimNumber: 'SUNCORP-2025-456',
    atFaultPartyInsuranceCompany: 'Suncorp',
    atFaultPartyVehicleRego: 'SYD789',
    
    
    invoiced: 6800,
    reserve: 6500,
    agreed: 6200,
    paid: 0,
    accidentDate: '2025-01-25',
    accidentTime: '14:45',
    accidentDescription: 'Side-swipe accident while merging on the M1. At-fault party failed to check blind spot.'
  },
  {
    caseNumber: `CASE-${Date.now().toString().slice(-6)}03`,
    status: 'Closed',
    lastUpdated: 'Just now',
    clientName: 'Emma Rodriguez',
    clientPhone: '0432 111 222',
    clientEmail: 'emma.rodriguez@email.com',
    clientStreetAddress: '156 Adelaide Street',
    clientSuburb: 'Brisbane',
    clientState: 'QLD',
    clientPostcode: '4000',
    clientClaimNumber: 'QLD-2025-9876',
    clientInsuranceCompany: 'QBE',
    clientVehicleRego: 'QLD456',
    atFaultPartyName: 'David Lee',
    atFaultPartyPhone: '0455 666 777',
    atFaultPartyEmail: 'david.lee@email.com',
    atFaultPartyStreetAddress: '89 Queen Street',
    atFaultPartySuburb: 'Brisbane',
    atFaultPartyState: 'QLD',
    atFaultPartyPostcode: '4000',
    atFaultPartyClaimNumber: 'RACQ-CL-3456',
    atFaultPartyInsuranceCompany: 'RACQ',
    atFaultPartyVehicleRego: 'BNE321',
    
    
    invoiced: 5200,
    reserve: 5000,
    agreed: 4800,
    paid: 4800,
    accidentDate: '2025-01-20',
    accidentTime: '11:15',
    accidentDescription: 'T-bone collision at intersection. At-fault party ran red light.'
  },
  {
    caseNumber: `CASE-${Date.now().toString().slice(-6)}04`,
    status: 'New Matter',
    lastUpdated: 'Just now',
    clientName: 'Alexander Nguyen',
    clientPhone: '0467 890 123',
    clientEmail: 'alex.nguyen@email.com',
    clientStreetAddress: '234 St Kilda Road',
    clientSuburb: 'St Kilda',
    clientState: 'VIC',
    clientPostcode: '3182',
    clientClaimNumber: 'BUDGET-2025-111',
    clientInsuranceCompany: 'Budget Direct',
    clientVehicleRego: 'VIC999',
    atFaultPartyName: 'Lisa Anderson',
    atFaultPartyPhone: '0422 333 444',
    atFaultPartyEmail: 'l.anderson@email.com',
    atFaultPartyStreetAddress: '567 Chapel Street',
    atFaultPartySuburb: 'South Yarra',
    atFaultPartyState: 'VIC',
    atFaultPartyPostcode: '3141',
    atFaultPartyClaimNumber: 'GIO-AF-7890',
    atFaultPartyInsuranceCompany: 'GIO',
    atFaultPartyVehicleRego: 'YRR888',
    
    
    invoiced: 0,
    reserve: 3500,
    agreed: 0,
    paid: 0,
    accidentDate: '2025-01-29',
    accidentTime: '16:20',
    accidentDescription: 'Parking lot collision. At-fault party reversed into stationary motorcycle.'
  },
  {
    caseNumber: `CASE-${Date.now().toString().slice(-6)}05`,
    status: 'Paid',
    lastUpdated: 'Just now',
    clientName: 'Sophie Williams',
    clientPhone: '0444 555 666',
    clientEmail: 'sophie.w@email.com',
    clientStreetAddress: '90 William Street',
    clientSuburb: 'Perth',
    clientState: 'WA',
    clientPostcode: '6000',
    clientClaimNumber: 'RAC-WA-2025-234',
    clientInsuranceCompany: 'RAC WA',
    clientVehicleRego: 'WA678',
    atFaultPartyName: 'Thomas Brown',
    atFaultPartyPhone: '0488 999 000',
    atFaultPartyEmail: 'tom.brown@email.com',
    atFaultPartyStreetAddress: '456 Hay Street',
    atFaultPartySuburb: 'Subiaco',
    atFaultPartyState: 'WA',
    atFaultPartyPostcode: '6008',
    atFaultPartyClaimNumber: 'HBF-INS-5678',
    atFaultPartyInsuranceCompany: 'HBF Insurance',
    atFaultPartyVehicleRego: 'PER123',
    
    
    invoiced: 7500,
    reserve: 7000,
    agreed: 7200,
    paid: 7200,
    accidentDate: '2025-01-10',
    accidentTime: '08:45',
    accidentDescription: 'Head-on collision on single lane road. At-fault party crossed center line while overtaking.'
  }
];

async function createMockCases() {
  try {
    console.log('Creating mock cases...');
    
    for (const caseData of mockCases) {
      const response = await fetch('http://localhost:9006/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create case ${caseData.caseNumber}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✓ Created case: ${result.caseNumber} - ${result.clientName}`);
    }

    console.log('\n✅ Successfully created all 5 mock cases!');
  } catch (error) {
    console.error('Error creating mock cases:', error);
  }
}

// Run the script
createMockCases();