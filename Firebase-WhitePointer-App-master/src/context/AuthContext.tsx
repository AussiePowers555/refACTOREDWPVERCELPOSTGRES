import { createContext, useContext, useEffect, useState } from 'react';
import { useSessionStorage } from '../hooks/use-session-storage';

type User = {
  id: string;
  email: string;
  role: string;
  name: string;
  contactId?: string;
  workspaceId?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => void;
  login: (user: User) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  login: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useSessionStorage<User | null>('currentUser', null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('activeWorkspace');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const login = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);