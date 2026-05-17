'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { djangoApi, tokens } from '@/lib/api';

interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;
    const restore = tokens.getAccess()
      ? djangoApi.me().then((u) => ({ user: u, loading: false }))
      : Promise.resolve({ user: null, loading: false });

    restore.then(({ user: u, loading }) => {
      if (!cancelled) {
        setUser(u);
        setIsLoading(loading);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await djangoApi.login(email, password);
    const u = await djangoApi.me();
    setUser(u);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    await djangoApi.signup(name, email, password);
    await djangoApi.login(email, password);
    const u = await djangoApi.me();
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    tokens.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
