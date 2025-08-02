import { useState, useEffect, useCallback } from 'react';

// Generic database hook for API calls
export function useDatabase<T>(endpoint: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(`Error fetching ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(async (item: Omit<T, 'id'>) => {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newItem = await response.json();
      setData(prev => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      throw err;
    }
  }, [endpoint]);

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setData(prev => prev.map(item => 
        (item as any).id === id ? { ...item, ...updates } : item
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    }
  }, [endpoint]);

  const remove = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setData(prev => prev.filter(item => (item as any).id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    }
  }, [endpoint]);

  return {
    data,
    setData,
    loading,
    error,
    refresh: fetchData,
    create,
    update,
    remove,
  };
}

// Import from unified schema - SINGLE SOURCE OF TRUTH
import {
  CaseFrontend,
  ContactFrontend,
  WorkspaceFrontend,
  UserAccount,
  Bike,
  BikeFrontend
} from '@/lib/database-schema';

// Specific hooks for each data type - using frontend-friendly interfaces
export const useCases = () => useDatabase<CaseFrontend>('cases');
export const useContacts = () => useDatabase<ContactFrontend>('contacts');
export const useWorkspaces = () => useDatabase<WorkspaceFrontend>('workspaces');
export const useUsers = () => useDatabase<UserAccount>('users');
export const useBikes = () => useDatabase<BikeFrontend>('bikes');