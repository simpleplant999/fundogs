import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getApiBase } from '@/lib/api';

const STORAGE_KEY = 'fundogs_token';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  profilePhotoUrl?: string;
  role: 'USER' | 'ADMIN';
  organization: {
    id: string;
    name: string;
    slug: string;
    memberRole: 'ADMIN' | 'MEMBER';
  } | null;
};

export type UpdateMeInput = {
  fullName?: string;
  currentPassword?: string;
  newPassword?: string;
  profilePhotoUrl?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (fullName: string, email: string, password: string, inviteCode?: string) => Promise<AuthUser>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  updateMe: (patch: UpdateMeInput) => Promise<void>;
  uploadProfilePhoto: (_fileUri: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
    const base = getApiBase();
    const t = await AsyncStorage.getItem(STORAGE_KEY);
    if (!base || !t) {
      setUser(null);
      setToken(null);
      return;
    }
    const res = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setToken(null);
      return;
    }
    const me = (await res.json()) as AuthUser;
    setUser({
      ...me,
      organization: me.organization
        ? {
            ...me.organization,
            memberRole: me.organization.memberRole ?? 'MEMBER',
          }
        : null,
    });
    setToken(t);
  }, []);

  const updateMe = useCallback(async (patch: UpdateMeInput) => {
    const base = getApiBase();
    const t = await AsyncStorage.getItem(STORAGE_KEY);
    if (!base || !t) throw new Error('Not signed in');
    const body: Record<string, string> = {};
    if (patch.fullName !== undefined) body.fullName = patch.fullName.trim();
    if (patch.newPassword !== undefined) body.newPassword = patch.newPassword;
    if (patch.currentPassword !== undefined) body.currentPassword = patch.currentPassword;
    if (patch.profilePhotoUrl !== undefined) body.profilePhotoUrl = patch.profilePhotoUrl;
    if (Object.keys(body).length === 0) throw new Error('Nothing to update.');
    const res = await fetch(`${base}/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(parseApiError(data));
    const me = data as AuthUser;
    setUser({
      ...me,
      organization: me.organization
        ? {
            ...me.organization,
            memberRole: me.organization.memberRole ?? 'MEMBER',
          }
        : null,
    });
  }, []);

  const uploadProfilePhoto = useCallback(async (_fileUri: string) => {
    throw new Error('Profile photo upload is not available in the mobile app yet. Use the website.');
  }, []);

  useEffect(() => {
    void refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const base = getApiBase();
    if (!base) throw new Error('Set EXPO_PUBLIC_API_URL (same as web NEXT_PUBLIC_API_URL)');
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(parseApiError(data));
    const u = data.user as AuthUser;
    await AsyncStorage.setItem(STORAGE_KEY, data.accessToken as string);
    setToken(data.accessToken as string);
    const normalized: AuthUser = {
      ...u,
      organization: u.organization
        ? { ...u.organization, memberRole: u.organization.memberRole ?? 'MEMBER' }
        : null,
    };
    setUser(normalized);
    return normalized;
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string, inviteCode?: string) => {
      const base = getApiBase();
      if (!base) throw new Error('Set EXPO_PUBLIC_API_URL (same as web NEXT_PUBLIC_API_URL)');
      const body: Record<string, string> = { fullName, email, password };
      if (inviteCode?.trim()) body.inviteCode = inviteCode.trim();
      const res = await fetch(`${base}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(parseApiError(data));
      const u = data.user as AuthUser;
      await AsyncStorage.setItem(STORAGE_KEY, data.accessToken as string);
      setToken(data.accessToken as string);
      const normalized: AuthUser = {
        ...u,
        organization: u.organization
          ? { ...u.organization, memberRole: u.organization.memberRole ?? 'MEMBER' }
          : null,
      };
      setUser(normalized);
      return normalized;
    },
    [],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
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
      updateMe,
      uploadProfilePhoto,
    }),
    [user, token, loading, login, register, logout, refreshMe, updateMe, uploadProfilePhoto],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
