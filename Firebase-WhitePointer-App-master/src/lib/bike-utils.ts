import { BikeFrontend as Bike } from '@/lib/database-schema';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';

export interface BikeRateCalculation {
  days: number;
  rateATotal: number;
  rateBTotal: number;
  totalCost: number;
  dailyRateA: number;
  dailyRateB: number;
  startDate: string;
  endDate: string;
}

/**
 * Calculate bike rental costs based on assignment period
 */
export function calculateBikeRates(bike: Bike): BikeRateCalculation | null {
  if (!bike.assignmentStartDate || !bike.assignmentEndDate) {
    return null;
  }

  try {
    const startDate = parseISO(bike.assignmentStartDate);
    const endDate = parseISO(bike.assignmentEndDate);

    if (!isValid(startDate) || !isValid(endDate)) {
      return null;
    }

    const days = differenceInDays(endDate, startDate) + 1; // Include both start and end dates
    
    if (days <= 0) {
      return null;
    }

    const dailyRateA = bike.dailyRateA || 0;
    const dailyRateB = bike.dailyRateB || 0;
    const rateATotal = dailyRateA * days;
    const rateBTotal = dailyRateB * days;
    const totalCost = rateATotal + rateBTotal;

    return {
      days,
      rateATotal,
      rateBTotal,
      totalCost,
      dailyRateA,
      dailyRateB,
      startDate: bike.assignmentStartDate,
      endDate: bike.assignmentEndDate
    };
  } catch (error) {
    console.error('Error calculating bike rates:', error);
    return null;
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return dateString;
    }
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    return dateString;
  }
}

/**
 * Get bike status display with color coding
 */
export function getBikeStatusInfo(bike: Bike) {
  const status = bike.status;
  
  switch (status) {
    case 'available':
      return { color: 'green', label: 'Available' };
    case 'assigned':
      return { color: 'blue', label: 'Assigned' };
    case 'maintenance':
      return { color: 'orange', label: 'Maintenance' };
    case 'retired':
      return { color: 'red', label: 'Retired' };
    default:
      return { color: 'gray', label: status };
  }
}

/**
 * Check if bike assignment dates are valid
 */
export function validateAssignmentDates(startDate: string, endDate: string): {
  isValid: boolean;
  error?: string;
} {
  if (!startDate || !endDate) {
    return { isValid: false, error: 'Both start and end dates are required' };
  }

  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (!isValid(start) || !isValid(end)) {
      return { isValid: false, error: 'Invalid date format' };
    }

    if (start > end) {
      return { isValid: false, error: 'Start date must be before end date' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Error validating dates' };
  }
}

/**
 * Generate assignment summary text
 */
export function getAssignmentSummary(bike: Bike): string {
  if (!bike.assignedCaseId) {
    return 'Not assigned';
  }

  const rateInfo = calculateBikeRates(bike);
  if (rateInfo) {
    return `Case ${bike.assignedCaseId} (${rateInfo.days} days - ${formatCurrency(rateInfo.totalCost)})`;
  }

  return `Case ${bike.assignedCaseId}`;
}