import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserSchema } from '@insforge/sdk';
import { insforge } from '../lib/insforgeClient';
import { persistInsforgeRefreshToken, persistRefreshTokenFromAuthPayload } from '../lib/insforgeAuthStorage';
import { ADMIN_EMAIL } from '../config/volera';
import { fetchProfile, type VoleraProfile } from '../lib/profileApi';

type AuthUser = UserSchema;

type AuthContextValue = {
  ready: boolean;
  user: AuthUser | null;
  profile: VoleraProfile | null;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    redirectTo?: string;
  }) => Promise<{
    error: Error | null;
    requireEmailVerification?: boolean;
  }>;
  verifyEmail: (
    email: string,
    otp: string
  ) => Promise<{ error: Error | null; userId?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<VoleraProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    const { data: u } = await insforge.auth.getCurrentUser();
    const current = u?.user ?? null;
    setUser(current);
    if (!current?.id) {
      setProfile(null);
      return;
    }
    const { data: p } = await fetchProfile(current.id);
    setProfile(p);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshProfile();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshProfile]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const emailMatch = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    return profile?.role === 'admin' || emailMatch;
  }, [user, profile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) return { error: error as Error };
    persistRefreshTokenFromAuthPayload(data);
    if (data?.user) {
      setUser(data.user);
      const { data: p } = await fetchProfile(data.user.id);
      setProfile(p);
    }
    return { error: null };
  }, []);

  const signUp = useCallback(
    async (params: {
      email: string;
      password: string;
      fullName: string;
      redirectTo?: string;
    }) => {
      const { data, error } = await insforge.auth.signUp({
        email: params.email,
        password: params.password,
        name: params.fullName,
        redirectTo: params.redirectTo,
      });
      if (error) return { error: error as Error };
      persistRefreshTokenFromAuthPayload(data);
      return {
        error: null,
        requireEmailVerification: Boolean(data?.requireEmailVerification),
      };
    },
    []
  );

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) return { error: error as Error };
    persistRefreshTokenFromAuthPayload(data);
    const u = data?.user;
    if (u) {
      setUser(u);
      const { data: p } = await fetchProfile(u.id);
      setProfile(p);
    }
    return { error: null, userId: u?.id };
  }, []);

  const signOut = useCallback(async () => {
    await insforge.auth.signOut();
    persistInsforgeRefreshToken(null);
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      profile,
      isAdmin,
      refreshProfile,
      signIn,
      signUp,
      verifyEmail,
      signOut,
    }),
    [ready, user, profile, isAdmin, refreshProfile, signIn, signUp, verifyEmail, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
