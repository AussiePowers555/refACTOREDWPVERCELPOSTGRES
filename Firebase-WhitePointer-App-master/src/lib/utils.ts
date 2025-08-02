// Utility functions for document signing flow
import type { NextRequest } from 'next/server';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// CSS class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Client IP detection from request headers
export function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0] || realIp || 'unknown';
}

// Type definitions for document metadata
export interface CaseDetails {
  id: string;
  clientId: string;
  caseNumber: string;
}

export interface DocumentMetadata {
  caseId: string;
  documentType: string;
  storagePath: string;
  signedAt: string;
  encryption: {
    algorithm: string;
    iv: string;
    keyVersion: string;
  };
  hash: string;
}
