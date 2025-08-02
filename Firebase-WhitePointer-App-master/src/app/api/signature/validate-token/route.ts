import { NextRequest, NextResponse } from 'next/server';
import { getSignatureToken } from '@/lib/signature-tokens-db';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schema
const validateTokenSchema = z.object({
  token: z.string().min(64).max(64) // SHA256 hash is 64 characters
});

// Token expiry time (24 hours)
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateTokenSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Look up token in database
    const tokenData = await getSignatureToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    if (Date.now() > expiresAt.getTime()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 401 }
      );
    }

    // Check if token has already been used
    if (tokenData.status === 'completed') {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 401 }
      );
    }

    // Token is valid
    return NextResponse.json({
      caseId: tokenData.case_id,
      expiresAt: tokenData.expires_at
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate a new signature token (called by admin when sending agreement)
export async function PUT(request: NextRequest) {
  try {
    // This would normally require admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    // This functionality would now use the database-based createSignatureToken function
    // For now, return a placeholder response
    return NextResponse.json({
      error: 'Token generation via PUT method not yet implemented with database backend',
      message: 'Use the POST /api/test-jotform-prefill endpoint to test token creation'
    }, { status: 501 });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}