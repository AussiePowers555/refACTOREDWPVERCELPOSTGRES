import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import crypto from 'crypto';

// Simple password hashing for now (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'salt_pbr_2024').digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Initialize database
    await ensureDatabaseInitialized();
    
    // TEMPORARY: Direct bypass for testing
    if ((email === 'whitepointer2016@gmail.com' || email === 'michaelalanwilson@gmail.com') && password === 'Tr@ders84') {
      return NextResponse.json({
        success: true,
        user: {
          id: `dev-${Date.now()}`,
          email: email,
          role: 'developer',
          status: 'active',
          first_login: false,
          contact_id: email === 'whitepointer2016@gmail.com' ? 'contact-david-001' : null,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        }
      });
    }
    
    // First check if user exists in database
    const user = await DatabaseService.getUserByEmail(email);
    
    if (user) {
      // Check password hash
      const passwordHash = hashPassword(password);
      if (user.password_hash === passwordHash || user.password_hash === password) {
        // Update last login
        await DatabaseService.updateUserAccount(user.id, {
          last_login: new Date().toISOString()
        });
        
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            first_login: user.first_login,
            contact_id: user.contact_id,
            created_at: user.created_at,
            last_login: new Date().toISOString()
          }
        });
      }
    }
    
    // Fallback to hardcoded credentials for backward compatibility
    if (
      (email === 'whitepointer2016@gmail.com' && password === 'Tr@ders84') ||
      (email === 'michaelalanwilson@gmail.com' && password === 'Tr@ders84') ||
      (email === 'admin@whitepointer.com' && password === 'admin') ||
      (email === 'admin' && password === 'admin')
    ) {
      // Create user in database if not exists
      if (!user) {
        const contactId = email === 'whitepointer2016@gmail.com' ? 'contact-david-001' : null;
        const newUser = await DatabaseService.createUserAccount({
          email: email,
          password_hash: hashPassword(password),
          role: email.includes('admin') ? 'admin' : 'developer',
          status: 'active',
          contact_id: contactId,
          first_login: false,
          remember_login: false
        });
        
        return NextResponse.json({
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            status: 'active',
            first_login: false,
            contact_id: contactId,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          }
        });
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    );
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}