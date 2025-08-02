import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

const mockCases = [
  {
    caseNumber: 'MOCK-001',
    clientName: 'Emma Thompson',
    clientEmail: 'emma.thompson@example.com',
    clientPhone: '0423456789',
    clientStreetAddress: '42 Collins Street',
    clientSuburb: 'Melbourne',
    clientState: 'VIC',
    clientPostcode: '3000',
    clientClaimNumber: 'CL001',
    clientInsuranceCompany: 'RACV',
    clientVehicleRego: 'ABC123',
    atFaultPartyName: 'Michael Brown',
    atFaultPartyEmail: 'michael.brown@example.com',
    atFaultPartyPhone: '0434567890',
    atFaultPartyStreetAddress: '15 George Street',
    atFaultPartySuburb: 'Sydney',
    atFaultPartyState: 'NSW',
    atFaultPartyPostcode: '2000',
    atFaultPartyClaimNumber: 'AF001',
    atFaultPartyInsuranceCompany: 'AAMI',
    atFaultPartyVehicleRego: 'XYZ789',
    accidentDate: '2025-01-28',
    accidentTime: '14:30',
    accidentDescription: 'Rear-end collision at traffic lights. Client was stationary when hit from behind.',
    invoiced: 2500,
    reserve: 2500,
    agreed: 2500,
    paid: 0,
    rentalCompany: 'PBikeRescue Rentals',
    lawyer: 'Smith & Co Lawyers',
    status: 'Active'
  },
  {
    caseNumber: 'MOCK-002',
    clientName: 'James Wilson',
    clientEmail: 'james.wilson@example.com',
    clientPhone: '0445678901',
    clientStreetAddress: '123 Chapel Street',
    clientSuburb: 'South Yarra',
    clientState: 'VIC',
    clientPostcode: '3141',
    clientClaimNumber: 'CL002',
    clientInsuranceCompany: 'Budget Direct',
    clientVehicleRego: 'DEF456',
    atFaultPartyName: 'Sarah Davis',
    atFaultPartyEmail: 'sarah.davis@example.com',
    atFaultPartyPhone: '0456789012',
    atFaultPartyStreetAddress: '789 King Street',
    atFaultPartySuburb: 'Melbourne',
    atFaultPartyState: 'VIC',
    atFaultPartyPostcode: '3000',
    atFaultPartyClaimNumber: 'AF002',
    atFaultPartyInsuranceCompany: 'Allianz',
    atFaultPartyVehicleRego: 'GHI789',
    accidentDate: '2025-01-29',
    accidentTime: '09:15',
    accidentDescription: 'Side-swipe accident during lane change. Other driver failed to check blind spot.',
    invoiced: 1800,
    reserve: 1800,
    agreed: 1800,
    paid: 1800,
    rentalCompany: 'City Wide Rentals',
    lawyer: 'Davis Legal',
    status: 'Paid'
  },
  {
    caseNumber: 'MOCK-003',
    clientName: 'Lisa Chen',
    clientEmail: 'lisa.chen@example.com',
    clientPhone: '0467890123',
    clientStreetAddress: '456 Queen Street',
    clientSuburb: 'Brisbane',
    clientState: 'QLD',
    clientPostcode: '4000',
    clientClaimNumber: 'CL003',
    clientInsuranceCompany: 'Suncorp',
    clientVehicleRego: 'JKL012',
    atFaultPartyName: 'Robert Taylor',
    atFaultPartyEmail: 'robert.taylor@example.com',
    atFaultPartyPhone: '0478901234',
    atFaultPartyStreetAddress: '321 Adelaide Street',
    atFaultPartySuburb: 'Brisbane',
    atFaultPartyState: 'QLD',
    atFaultPartyPostcode: '4000',
    atFaultPartyClaimNumber: 'AF003',
    atFaultPartyInsuranceCompany: 'NRMA',
    atFaultPartyVehicleRego: 'MNO345',
    accidentDate: '2025-01-30',
    accidentTime: '16:45',
    accidentDescription: 'Intersection collision. Other driver ran red light and T-boned client.',
    invoiced: 8500,
    reserve: 8000,
    agreed: 7500,
    paid: 0,
    rentalCompany: 'PBikeRescue Rentals',
    lawyer: 'Smith & Co Lawyers',
    status: 'Settlement Agreed'
  },
  {
    caseNumber: 'MOCK-004',
    clientName: 'David Rodriguez',
    clientEmail: 'david.rodriguez@example.com',
    clientPhone: '0489012345',
    clientStreetAddress: '789 Rundle Mall',
    clientSuburb: 'Adelaide',
    clientState: 'SA',
    clientPostcode: '5000',
    clientClaimNumber: 'CL004',
    clientInsuranceCompany: 'RAA',
    clientVehicleRego: 'PQR678',
    atFaultPartyName: 'Amanda White',
    atFaultPartyEmail: 'amanda.white@example.com',
    atFaultPartyPhone: '0490123456',
    atFaultPartyStreetAddress: '159 North Terrace',
    atFaultPartySuburb: 'Adelaide',
    atFaultPartyState: 'SA',
    atFaultPartyPostcode: '5000',
    atFaultPartyClaimNumber: 'AF004',
    atFaultPartyInsuranceCompany: 'Youi',
    atFaultPartyVehicleRego: 'STU901',
    accidentDate: '2025-01-31',
    accidentTime: '11:20',
    accidentDescription: 'Parking lot incident. Client was backing out when another vehicle reversed into them.',
    invoiced: 1200,
    reserve: 1200,
    agreed: 1200,
    paid: 1200,
    rentalCompany: 'City Wide Rentals',
    lawyer: 'Davis Legal',
    status: 'Completed'
  },
  {
    caseNumber: 'MOCK-005',
    clientName: 'Sophie Green',
    clientEmail: 'sophie.green@example.com',
    clientPhone: '0401234567',
    clientStreetAddress: '963 Hay Street',
    clientSuburb: 'Perth',
    clientState: 'WA',
    clientPostcode: '6000',
    clientClaimNumber: 'CL005',
    clientInsuranceCompany: 'HBF',
    clientVehicleRego: 'VWX234',
    atFaultPartyName: 'Unknown (Hit and Run)',
    atFaultPartyEmail: '',
    atFaultPartyPhone: '',
    atFaultPartyStreetAddress: 'Unknown',
    atFaultPartySuburb: 'Unknown',
    atFaultPartyState: 'WA',
    atFaultPartyPostcode: '',
    atFaultPartyClaimNumber: '',
    atFaultPartyInsuranceCompany: 'Under Investigation',
    atFaultPartyVehicleRego: 'Unknown',
    accidentDate: '2025-02-01',
    accidentTime: '08:00',
    accidentDescription: 'Hit and run incident. Client was parked legally when unknown vehicle struck and fled.',
    invoiced: 4200,
    reserve: 4000,
    agreed: 0,
    paid: 0,
    rentalCompany: 'PBikeRescue Rentals',
    lawyer: 'Smith & Co Lawyers',
    status: 'Investigation'
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('🏗️ Creating mock cases...');
    
    // Initialize database first
    await ensureDatabaseInitialized();
    console.log('✅ Database initialized for mock case creation');
    
    console.log('📊 Mock cases data:', mockCases.length, 'cases to create');

    const createdCases = [];
    const errors = [];

    // Create all 5 mock cases
    for (const mockCase of mockCases) {
      try {
        // Map the mock case data to match the database schema exactly
        const caseData = {
          caseNumber: mockCase.caseNumber,
          status: mockCase.status,
          lastUpdated: 'Just now',
          
          // Client (NAF) details
          clientName: mockCase.clientName,
          clientPhone: mockCase.clientPhone,
          clientEmail: mockCase.clientEmail,
          clientStreetAddress: mockCase.clientStreetAddress,
          clientSuburb: mockCase.clientSuburb,
          clientState: mockCase.clientState,
          clientPostcode: mockCase.clientPostcode,
          clientClaimNumber: mockCase.clientClaimNumber,
          clientInsuranceCompany: mockCase.clientInsuranceCompany,
          clientInsurer: '',
          clientVehicleRego: mockCase.clientVehicleRego,

          // At-fault party details
          atFaultPartyName: mockCase.atFaultPartyName,
          atFaultPartyPhone: mockCase.atFaultPartyPhone,
          atFaultPartyEmail: mockCase.atFaultPartyEmail,
          atFaultPartyStreetAddress: mockCase.atFaultPartyStreetAddress,
          atFaultPartySuburb: mockCase.atFaultPartySuburb,
          atFaultPartyState: mockCase.atFaultPartyState,
          atFaultPartyPostcode: mockCase.atFaultPartyPostcode,
          atFaultPartyClaimNumber: mockCase.atFaultPartyClaimNumber,
          atFaultPartyInsuranceCompany: mockCase.atFaultPartyInsuranceCompany,
          atFaultPartyInsurer: '',
          atFaultPartyVehicleRego: mockCase.atFaultPartyVehicleRego,

          // Financial details
          invoiced: mockCase.invoiced || 0,
          reserve: mockCase.reserve || 0,
          agreed: mockCase.agreed || 0,
          paid: mockCase.paid || 0,

          // Assignments
          rentalCompany: mockCase.rentalCompany,
          lawyer: mockCase.lawyer,

          // Accident details
          accidentDate: mockCase.accidentDate,
          accidentTime: mockCase.accidentTime,
          accidentDescription: mockCase.accidentDescription
        };

        const createdCase = DatabaseService.createCase(caseData);
        createdCases.push(createdCase);
        console.log(`✅ Created case: ${mockCase.caseNumber}`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Error creating case ${mockCase.caseNumber}:`, errorMsg);
        
        // Skip if case already exists (unique constraint)
        if (errorMsg.includes('UNIQUE constraint failed')) {
          console.log(`⚠️ Case ${mockCase.caseNumber} already exists, skipping...`);
        } else {
          // Store other error details for debugging
          errors.push({
            caseNumber: mockCase.caseNumber,
            error: errorMsg
          });
        }
      }
    }

    console.log(`✅ Successfully created ${createdCases.length} mock cases`);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdCases.length} mock cases`,
      createdCount: createdCases.length,
      skippedExisting: mockCases.length - createdCases.length - errors.length,
      errors: errors.length > 0 ? errors : undefined // Only include errors if there are real errors
    });

  } catch (error) {
    console.error('❌ Error creating mock cases:', error);
    return NextResponse.json(
      { error: 'Failed to create mock cases', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
