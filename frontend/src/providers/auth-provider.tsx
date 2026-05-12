'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { normalizeApiBaseUrl } from '@/lib/api-base';

const STORAGE_KEY = 'fundogs_token';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (fullName: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function getClientApiBase(): string {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? '');
}

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Request failed';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const base = getClientApiBase();
    const t =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!base || !t) {
      setUser(null);
      setToken(null);
      return;
    }
    const res = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setToken(null);
      return;
    }
    const me = (await res.json()) as AuthUser;
    setUser(me);
    setToken(t);
  }, []);

  useEffect(() => {
    void refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const base = getClientApiBase();
    if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(parseApiError(data));
    const u = data.user as AuthUser;
    localStorage.setItem(STORAGE_KEY, data.accessToken);
    setToken(data.accessToken);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const base = getClientApiBase();
      if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
      const res = await fetch(`${base}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data));
      const u = data.user as AuthUser;
      localStorage.setItem(STORAGE_KEY, data.accessToken);
      setToken(data.accessToken);
      setUser(u);
      return u;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, token, loading, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
