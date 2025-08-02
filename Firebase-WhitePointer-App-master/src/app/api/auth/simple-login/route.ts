import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('Simple login attempt:', { email, password });
    
    // Simple hardcoded authentication for testing
    if ((email === 'whitepointer2016@gmail.com' || email === 'michaelalanwilson@gmail.com') && password === 'Tr@ders84') {
      return NextResponse.json({
        success: true,
        user: {
          id: `dev-${Date.now()}`,
          email: email,
          role: 'developer',
          name: 'Developer'
        }
      });
    }
    
    if ((email === 'admin' || email === 'admin@whitepointer.com') && password === 'admin') {
      return NextResponse.json({
        success: true,
        user: {
          id: `admin-${Date.now()}`,
          email: email,
          role: 'admin',
          name: 'Administrator'
        }
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    );
    
  } catch (error) {
    console.error('Simple login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}