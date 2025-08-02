// Session-based authentication (converted from Firebase Auth)
import { DatabaseService, ensureDatabaseInitialized } from './database';
import { sendEmail } from './email-service';
import crypto from 'crypto';

// User type for session-based auth
export interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  contactId?: string;
  workspaceId?: string;
}

// Mock auth object for compatibility
export const auth = {
  currentUser: null as User | null,
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    // Check session storage for current user
    if (typeof window !== 'undefined') {
      const user = sessionStorage.getItem('currentUser');
      callback(user ? JSON.parse(user) : null);
    }
    return () => {}; // Unsubscribe function
  },
  signOut: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('activeWorkspace');
    }
    return Promise.resolve();
  }
};

export const sendMagicLink = async (email: string) => {
  try {
    ensureDatabaseInitialized();

    // Check if user exists in database
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      return { success: false, error: { message: 'User not found' } };
    }

    // Generate secure login token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store login token (in production, use a separate tokens table)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('loginToken', JSON.stringify({
        token,
        email,
        expires: expires.toISOString()
      }));
    }

    // Send email with magic link
    const magicLink = `${process.env.NEXT_PUBLIC_ACTION_URL || 'http://localhost:9003/auth/confirm'}?token=${token}&email=${encodeURIComponent(email)}`;
    
    await sendEmail({
      to: email,
      subject: 'Sign in to PBike Rescue',
      html: `
        <h2>Sign in to PBike Rescue</h2>
        <p>Click the link below to sign in:</p>
        <a href="${magicLink}" style="display: inline-block; padding: 12px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
          Sign In
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    // Save the email to localStorage for later verification
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('emailForSignIn', email);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending magic link:', error);
    return { success: false, error };
  }
};

export const verifyMagicLink = async () => {
  try {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not in browser environment' };
    }

    // Get token and email from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');

    if (!token || !email) {
      return { success: false, error: 'Missing token or email' };
    }

    // Verify token (in production, check against database)
    const storedToken = sessionStorage.getItem('loginToken');
    if (!storedToken) {
      return { success: false, error: 'Invalid or expired token' };
    }

    const tokenData = JSON.parse(storedToken);
    if (tokenData.token !== token || tokenData.email !== email) {
      return { success: false, error: 'Invalid token' };
    }

    if (new Date() > new Date(tokenData.expires)) {
      return { success: false, error: 'Token expired' };
    }

    // Get user from database
    ensureDatabaseInitialized();
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Create session user object
    const sessionUser: User = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.email.split('@')[0], // Simple name from email
      contactId: user.contact_id,
      workspaceId: undefined // Set based on business logic
    };

    // Store user in session
    sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
    sessionStorage.removeItem('loginToken');
    window.localStorage.removeItem('emailForSignIn');

    return { success: true, user: sessionUser };
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return { success: false, error };
  }
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const user = sessionStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

export const signOutUser = async () => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('activeWorkspace');
      sessionStorage.removeItem('loginToken');
    }
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};

// Session management helpers
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

export const requireAuth = (callback: () => void) => {
  if (!isAuthenticated()) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return;
  }
  callback();
};

export const hasRole = (requiredRole: string): boolean => {
  const user = getCurrentUser();
  return user?.role === requiredRole;
};

export const hasAnyRole = (roles: string[]): boolean => {
  const user = getCurrentUser();
  return user ? roles.includes(user.role) : false;
};

// Create default admin user if none exists
export const ensureAdminUser = async () => {
  try {
    ensureDatabaseInitialized();
    
    // Check if admin user exists
    const existingAdmin = await DatabaseService.getUserByEmail('admin@pbike-rescue.local');
    if (existingAdmin) {
      return;
    }

    // Create default admin user
    const adminContact = await DatabaseService.createContact({
      name: 'System Administrator',
      company: 'PBike Rescue',
      type: 'Service Center',
      phone: 'N/A',
      email: 'admin@pbike-rescue.local',
      address: 'System Generated'
    });

    const adminUser = await DatabaseService.createUserAccount({
      email: 'admin@pbike-rescue.local',
      password_hash: 'no-password-needed', // Using magic link auth
      role: 'admin',
      status: 'active',
      contact_id: adminContact.id,
      first_login: true,
      remember_login: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log('✅ Default admin user created:', adminUser.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Initialize auth system
if (typeof window === 'undefined') {
  // Server-side initialization
  ensureAdminUser();
}

export const actionCodeSettings = {
  url: process.env.NEXT_PUBLIC_ACTION_URL || 'http://localhost:9003/auth/confirm',
  handleCodeInApp: true,
};

// For compatibility with existing Firebase imports
export const sendSignInLinkToEmail = sendMagicLink;