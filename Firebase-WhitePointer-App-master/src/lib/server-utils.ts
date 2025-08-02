"use server";

/**
 * Utility function to check if code is running on the server
 * This is useful for conditional imports of server-only modules
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Utility function to safely require a server-only module
 * This helps prevent client-side builds from including server-only code
 */
export function safeServerImport<T>(modulePath: string): T | null {
  if (!isServer()) {
    console.warn(`Attempted to import server-only module ${modulePath} in client context`);
    return null;
  }
  
  try {
    // Using dynamic import with require to ensure it's only loaded on the server
    // This will be properly tree-shaken by the Next.js compiler
    const module = require(modulePath);
    return module as T;
  } catch (error) {
    console.error(`Error importing server-only module ${modulePath}:`, error);
    return null;
  }
}

/**
 * Mark a function as server-side only
 * This is a type guard to prevent accidental client-side usage
 */
export function serverOnly<T extends (...args: any[]) => any>(
  fn: T,
  errorMessage = "This function can only be called on the server"
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!isServer()) {
      throw new Error(errorMessage);
    }
    return fn(...args) as ReturnType<T>;
  }) as T;
}
