import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { importedBikes } from '@/data/imported-bikes';
import type { BikeFrontend as Bike } from '@/lib/database-schema';

// Transform database row to Bike interface
function transformDbBikeToFrontend(dbBike: any): Bike {
  return {
    id: dbBike.id,
    make: dbBike.make,
    model: dbBike.model,
    registration: dbBike.registration,
    registrationExpires: dbBike.registration_expires || '',
    serviceCenter: dbBike.service_center,
    serviceCenterContactId: dbBike.service_center_contact_id,
    deliveryStreet: dbBike.delivery_street,
    deliverySuburb: dbBike.delivery_suburb,
    deliveryState: dbBike.delivery_state,
    deliveryPostcode: dbBike.delivery_postcode,
    lastServiceDate: dbBike.last_service_date || '',
    serviceNotes: dbBike.service_notes,
    status: dbBike.status || 'Available',
    location: dbBike.location || 'Main Warehouse',
    dailyRate: dbBike.daily_rate,
    dailyRateA: dbBike.daily_rate_a || dbBike.daily_rate || 85,
    dailyRateB: dbBike.daily_rate_b || 95,
    imageUrl: dbBike.image_url || 'https://placehold.co/300x200.png',
    imageHint: dbBike.image_hint || 'motorcycle sport',
    assignment: dbBike.assignment || '-',
    assignedCaseId: dbBike.assigned_case_id,
    assignmentStartDate: dbBike.assignment_start_date,
    assignmentEndDate: dbBike.assignment_end_date
  };
}

// Transform frontend bike to database format
function transformFrontendBikeToDb(bike: any): any {
  return {
    ...bike,
    registration_expires: bike.registrationExpires,
    service_center: bike.serviceCenter,
    service_center_contact_id: bike.serviceCenterContactId,
    delivery_street: bike.deliveryStreet,
    delivery_suburb: bike.deliverySuburb,
    delivery_state: bike.deliveryState,
    delivery_postcode: bike.deliveryPostcode,
    last_service_date: bike.lastServiceDate,
    service_notes: bike.serviceNotes,
    daily_rate: bike.dailyRate,
    daily_rate_a: bike.dailyRateA,
    daily_rate_b: bike.dailyRateB,
    image_url: bike.imageUrl,
    image_hint: bike.imageHint,
    assigned_case_id: bike.assignedCaseId,
    assignment_start_date: bike.assignmentStartDate,
    assignment_end_date: bike.assignmentEndDate
  };
}

export async function GET() {
  try {
    await ensureDatabaseInitialized();
    
    // Get all bikes from database
    let bikes = DatabaseService.getAllBikes();
    
    // If no bikes in database, import them from the CSV data
    if (bikes.length === 0) {
      console.log('No bikes in database, importing from CSV data...');
      DatabaseService.bulkInsertBikes(importedBikes);
      bikes = DatabaseService.getAllBikes();
    }
    
    // Transform bikes to frontend format
    const transformedBikes = bikes.map(transformDbBikeToFrontend);
    
    return NextResponse.json(transformedBikes);
  } catch (error) {
    console.error('Error fetching bikes:', error);
    return NextResponse.json({ error: 'Failed to fetch bikes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    const bikeData = await request.json();
    
    // Transform to database format
    const dbBikeData = transformFrontendBikeToDb(bikeData);
    
    const newBike = DatabaseService.createBike(dbBikeData);
    
    // Transform back to frontend format
    const transformedBike = transformDbBikeToFrontend(newBike);
    
    return NextResponse.json(transformedBike, { status: 201 });
  } catch (error) {
    console.error('Error creating bike:', error);
    return NextResponse.json({ error: 'Failed to create bike' }, { status: 500 });
  }
}