import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const confirmRedirectUrl = () => `${window.location.origin}/auth`;

// Supabase sends people back with #error=...&error_code=... when an email link is
// used up or expired. Turn that into a readable message and tidy the address bar.
function reportAuthLinkError() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (!hash.includes('error')) return;
  const params = new URLSearchParams(hash);
  const code = params.get('error_code');
  if (!code && !params.get('error')) return;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  toast({
    title: code === 'otp_expired' ? 'That email link has expired' : 'That email link did not work',
    description: code === 'otp_expired'
      ? 'Links work once and expire after a while. Sign in with your email and password, and we will offer to send a new one.'
      : params.get('error_description') ?? 'Please try again.',
    variant: 'destructive',
  });
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; needsConfirmation: boolean; alreadyRegistered: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAuthLinkError();
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: confirmRedirectUrl(),
        data: { full_name: fullName },
      },
    });
    // With email protection on, an already-confirmed address comes back with no identities.
    const alreadyRegistered = !error && !!data.user && (data.user.identities?.length ?? 0) === 0;
    return { error: error as Error | null, needsConfirmation: !error && !data.session && !alreadyRegistered, alreadyRegistered };
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: confirmRedirectUrl() },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      resendConfirmation,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
