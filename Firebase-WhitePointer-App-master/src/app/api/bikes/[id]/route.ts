import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import type { Bike } from '@/types/bike';

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
  const dbBike: any = {};
  
  // Map camelCase to snake_case
  if (bike.registrationExpires !== undefined) dbBike.registration_expires = bike.registrationExpires;
  if (bike.serviceCenter !== undefined) dbBike.service_center = bike.serviceCenter;
  if (bike.serviceCenterContactId !== undefined) dbBike.service_center_contact_id = bike.serviceCenterContactId;
  if (bike.deliveryStreet !== undefined) dbBike.delivery_street = bike.deliveryStreet;
  if (bike.deliverySuburb !== undefined) dbBike.delivery_suburb = bike.deliverySuburb;
  if (bike.deliveryState !== undefined) dbBike.delivery_state = bike.deliveryState;
  if (bike.deliveryPostcode !== undefined) dbBike.delivery_postcode = bike.deliveryPostcode;
  if (bike.lastServiceDate !== undefined) dbBike.last_service_date = bike.lastServiceDate;
  if (bike.serviceNotes !== undefined) dbBike.service_notes = bike.serviceNotes;
  if (bike.dailyRate !== undefined) dbBike.daily_rate = bike.dailyRate;
  if (bike.dailyRateA !== undefined) dbBike.daily_rate_a = bike.dailyRateA;
  if (bike.dailyRateB !== undefined) dbBike.daily_rate_b = bike.dailyRateB;
  if (bike.imageUrl !== undefined) dbBike.image_url = bike.imageUrl;
  if (bike.imageHint !== undefined) dbBike.image_hint = bike.imageHint;
  if (bike.assignedCaseId !== undefined) dbBike.assigned_case_id = bike.assignedCaseId;
  if (bike.assignmentStartDate !== undefined) dbBike.assignment_start_date = bike.assignmentStartDate;
  if (bike.assignmentEndDate !== undefined) dbBike.assignment_end_date = bike.assignmentEndDate;
  
  // Direct mappings
  if (bike.make !== undefined) dbBike.make = bike.make;
  if (bike.model !== undefined) dbBike.model = bike.model;
  if (bike.registration !== undefined) dbBike.registration = bike.registration;
  if (bike.status !== undefined) dbBike.status = bike.status;
  if (bike.location !== undefined) dbBike.location = bike.location;
  if (bike.assignment !== undefined) dbBike.assignment = bike.assignment;
  
  return dbBike;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized();
    const { id } = context.params;
    const bike = DatabaseService.getBikeById(id);
    
    if (!bike) {
      return NextResponse.json({ error: 'Bike not found' }, { status: 404 });
    }
    
    const transformedBike = transformDbBikeToFrontend(bike);
    return NextResponse.json(transformedBike);
  } catch (error) {
    console.error('Error fetching bike:', error);
    return NextResponse.json({ error: 'Failed to fetch bike' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized();
    const { id } = context.params;
    const updates = await request.json();

    const dbUpdates = transformFrontendBikeToDb(updates);
    DatabaseService.updateBike(id, dbUpdates);
    const updatedBike = DatabaseService.getBikeById(id);
    
    if (!updatedBike) {
      return NextResponse.json({ error: 'Bike not found after update' }, { status: 404 });
    }
    
    const transformedBike = transformDbBikeToFrontend(updatedBike);
    return NextResponse.json(transformedBike);
  } catch (error) {
    console.error('Error updating bike:', error);
    return NextResponse.json({ error: 'Failed to update bike' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await ensureDatabaseInitialized();
    const { id } = context.params;
    DatabaseService.deleteBike(id);
    
    return NextResponse.json({ message: 'Bike deleted successfully' });
  } catch (error) {
    console.error('Error deleting bike:', error);
    return NextResponse.json({ error: 'Failed to delete bike' }, { status: 500 });
  }
}