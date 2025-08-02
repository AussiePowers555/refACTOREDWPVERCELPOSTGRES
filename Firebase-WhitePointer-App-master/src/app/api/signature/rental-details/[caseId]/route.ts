import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { z } from 'zod';

// Helper to validate bearer token
async function validateBearerToken(request: NextRequest, caseId: string): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);

  // Verify token is valid for this case
  const tokenData = DatabaseService.getSignatureTokenByToken(token);

  if (!tokenData) {
    return false;
  }

  return tokenData.case_id === caseId && tokenData.status === 'pending';
}

export async function GET(
  request: NextRequest,
  context: { params: { caseId: string } }
) {
  try {
    const { caseId } = context.params;

    // Validate authorization
    const isAuthorized = await validateBearerToken(request, caseId);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify CSRF token
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token required' },
        { status: 403 }
      );
    }

    // Fetch case details
    const caseData = DatabaseService.getCaseById(caseId);

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // TODO: Implement bike assignment tracking in SQLite
    // For now, return basic rental details with case data

    const charges = {
      helmet: 0,
      ridingApparel: 0,
      adminFee: 95,
      deliveryPickupFee: 0,
      additionalDriver: 0,
      excessReduction: 0,
      totalIncGst: 95,
      gstAmount: 8.64
    };

    const rentalDetails = {
      make: 'N/A',
      model: 'N/A',
      hireDate: new Date().toISOString().split('T')[0],
      hireTime: '10:00',
      returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      returnTime: '10:00',
      areaOfUse: 'Metro Area - Unlimited KMS',
      hirerName: caseData?.clientName || '',
      phone: caseData?.clientPhone || '',
      address: '',
      suburb: '',
      state: '',
      postCode: '',
      dob: '',
      licenceNo: '',
      licenceState: '',
      licenceExp: ''
    };

    return NextResponse.json({
      rentalDetails,
      charges
    });

  } catch (error) {
    console.error('Rental details fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate days between dates
function calculateDays(startDate: any, endDate: Date): number {
  if (!startDate) return 0;
  
  const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
  const diffTime = Math.abs(endDate.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays); // Minimum 1 day
}

// Helper function to calculate return date (7 days from hire date)
function calculateReturnDate(hireDate: any): Date {
  const date = hireDate?.toDate ? hireDate.toDate() : new Date(hireDate || Date.now());
  date.setDate(date.getDate() + 7);
  return date;
}