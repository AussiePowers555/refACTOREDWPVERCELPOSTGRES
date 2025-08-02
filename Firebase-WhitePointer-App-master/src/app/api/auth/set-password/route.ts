import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import crypto from 'crypto';

// Simple password hashing for now (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Initialize database
    await ensureDatabaseInitialized();
    
    // Check if user exists
    const existingUser = await DatabaseService.getUserByEmail(email);
    
    if (existingUser) {
      // Update existing user's password
      await DatabaseService.updateUserAccount(existingUser.id, {
        password_hash: hashPassword(password),
        updated_at: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role
        }
      });
    } else {
      // Create new user with the password
      const newUser = await DatabaseService.createUserAccount({
        email: email,
        password_hash: hashPassword(password),
        role: email.includes('admin') ? 'admin' : 'user',
        status: 'active',
        contact_id: null,
        first_login: false,
        remember_login: false
      });
      
      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role
        }
      });
    }
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set password' },
      { status: 500 }
    );
  }
}