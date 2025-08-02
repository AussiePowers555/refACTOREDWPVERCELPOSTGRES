
"use client";

import { useState, useEffect } from 'react';

function getValue<T>(key: string, initialValue: T | (() => T)): T {
  if (typeof window === 'undefined') {
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
  try {
    const item = window.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : (initialValue instanceof Function ? initialValue() : initialValue);
  } catch (error) {
    console.warn(`Error reading sessionStorage key “${key}”:`, error);
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
}

export function useSessionStorage<T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => getValue(key, initialValue));

  useEffect(() => {
    setStoredValue(getValue(key, initialValue));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Listen for storage changes from other parts of the app
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key && e.storageArea === window.sessionStorage) {
          try {
            const newValue = e.newValue ? JSON.parse(e.newValue) : (initialValue instanceof Function ? initialValue() : initialValue);
            setStoredValue(newValue);
          } catch (error) {
            console.warn(`Error parsing sessionStorage change for key "${key}":`, error);
          }
        }
      };

      // Listen to storage events (cross-tab)
      window.addEventListener('storage', handleStorageChange);

      // Also listen for custom events (same-tab)
      const handleCustomStorageChange = (e: CustomEvent) => {
        if (e.detail.key === key) {
          setStoredValue(e.detail.value);
        }
      };
      
      window.addEventListener('sessionStorageChange', handleCustomStorageChange as EventListener);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('sessionStorageChange', handleCustomStorageChange as EventListener);
      };
    }
  }, [key, initialValue]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (storedValue === null || storedValue === undefined) {
          window.sessionStorage.removeItem(key);
        } else {
          window.sessionStorage.setItem(key, JSON.stringify(storedValue));
        }
        
        // Dispatch custom event for same-tab synchronization
        window.dispatchEvent(new CustomEvent('sessionStorageChange', {
          detail: { key, value: storedValue }
        }));
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
