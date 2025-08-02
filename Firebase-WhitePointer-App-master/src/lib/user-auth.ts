import { UserAccount, UserRole, UserStatus } from './database-schema';
import { DatabaseService } from './database';
import CryptoJS from 'crypto-js';

// Password hashing utility
const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password + 'salt_pbr_2024').toString();
};

// Generate random password
export const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Password validation
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
};

// Initialize developer accounts
export const initializeDeveloperAccounts = async () => {
  if (typeof window !== 'undefined') {
    // Client-side: try localStorage first for backward compatibility
    const stored = localStorage.getItem('userAccounts');
    if (stored) {
      return JSON.parse(stored);
    }
  }

  // Server-side or no localStorage: use database
  try {
    const allUsers = await DatabaseService.getAllUserAccounts();
    const existingDevs = allUsers.filter(u => u.role === 'developer');
    if (existingDevs.length > 0) {
      return existingDevs;
    }
    
    // Create developer accounts if they don't exist
    const developers = [
      {
        email: 'whitepointer2016@gmail.com',
        password_hash: hashPassword('Tr@ders84'),
        role: 'developer' as UserRole,
        status: 'active' as UserStatus,
        first_login: false,
        remember_login: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        email: 'michaelalanwilson@gmail.com',
        password_hash: hashPassword('Tr@ders84'),
        role: 'developer' as UserRole,
        status: 'active' as UserStatus,
        first_login: false,
        remember_login: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    
    const createdDevs = await Promise.all(developers.map(dev => DatabaseService.createUserAccount(dev)));
    return createdDevs;
  } catch (error) {
    console.error('Error initializing developer accounts:', error);
    return [];
  }
};

// Get all user accounts
export const getUserAccounts = async (): Promise<UserAccount[]> => {
  try {
    return await DatabaseService.getAllUserAccounts();
  } catch (error) {
    console.error('Error getting user accounts:', error);
    // Fallback to localStorage for client-side
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userAccounts');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }
};

// Create new user account
export const createUserAccount = async (email: string, role: UserRole, contactId?: string): Promise<{ account: UserAccount; password: string }> => {
  const password = generateRandomPassword();
  const accountData = {
    email,
    password_hash: hashPassword(password),
    role,
    status: 'pending_password_change' as UserStatus,
    contact_id: contactId,
    first_login: true,
    remember_login: role === 'admin' || role === 'developer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  try {
    const account = await DatabaseService.createUserAccount(accountData);
    return { account, password };
  } catch (error) {
    console.error('Error creating user account:', error);
    throw error;
  }
};

// Authenticate user
export const authenticateUser = async (email: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
  try {
    const hashedPassword = hashPassword(password);
    const user = await DatabaseService.getUserByEmail(email);
    
    if (!user || user.password_hash !== hashedPassword) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    if (user.status === 'disabled') {
      return { success: false, error: 'Account is disabled' };
    }
    
    // Update last login
    await DatabaseService.updateUserAccount(user.id, {
      last_login: new Date().toISOString()
    });
    
    return { success: true, user };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

// Change password
export const changePassword = (userId: string, newPassword: string): boolean => {
  try {
    DatabaseService.updateUserAccount(userId, {
      password_hash: hashPassword(newPassword),
      status: 'active',
      first_login: false,
      updated_at: new Date() as any
    });
    return true;
  } catch (error) {
    console.error('Error changing password:', error);
    return false;
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<UserAccount | undefined> => {
  try {
    const users = await DatabaseService.getAllUserAccounts();
    return users.find(u => u.id === userId);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return undefined;
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<UserAccount | undefined> => {
  try {
    return await DatabaseService.getUserByEmail(email) || undefined;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return undefined;
  }
};

// Send password via email (mock implementation)
export const sendPasswordEmail = async (email: string, password: string): Promise<boolean> => {
  try {
    // Mock email sending - in production, integrate with email service
    console.log(`Email sent to ${email} with password: ${password}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};