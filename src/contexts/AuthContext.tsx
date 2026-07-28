/**
 * AuthContext — global authentication state provider.
 *
 * Replaces Flutter's Riverpod auth provider.
 * Subscribes to Firebase auth state changes and exposes the current user
 * to the entire component tree via React Context.
 */

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import auth from '@/lib/firebase/auth';
import { AuthRepository, AuthError } from '@/repositories/auth.repository';
import type { AppUser } from '@/types/models';

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** The currently signed-in user, or null if not authenticated. */
  user: AppUser | null;
  /** True while Firebase auth is resolving the initial state. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

function toAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? toAppUser(firebaseUser) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await AuthRepository.signInWithEmail({ email, password });
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await AuthRepository.registerWithEmail({ name, email, password });
    },
    []
  );

  const signOut = useCallback(async () => {
    await AuthRepository.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/** Access auth state anywhere in the component tree. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}

export { AuthError };
