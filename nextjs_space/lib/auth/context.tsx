'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../supabase/client';
import { JNXUser } from '../db/helpers';

interface AuthContextType {
  user: User | null;
  jnxUser: JNXUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [jnxUser, setJnxUser] = useState<JNXUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchJnxUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchJnxUser(session.user.id);
      } else {
        setJnxUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchJnxUser = async (supabaseUserId: string) => {
    try {
      const response = await fetch(`/api/auth/user?supabaseUserId=${supabaseUserId}`);
      if (response.ok) {
        const data = await response.json();
        setJnxUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching JNX user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.auth.signOut();
    setUser(null);
    setJnxUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, jnxUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
