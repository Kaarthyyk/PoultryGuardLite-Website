/**
 * AuthRepository — web equivalent of Flutter's AuthRepository.
 *
 * Wraps Firebase Auth with typed, user-friendly error messages.
 * Error codes mirror Flutter's _mapError() switch exactly.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import auth from '@/lib/firebase/auth';

// ── Error mapping ─────────────────────────────────────────────────────────────

function mapAuthError(code: string, fallback?: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return fallback ?? 'Authentication failed.';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// ── Repository ────────────────────────────────────────────────────────────────

export const AuthRepository = {
  /** The currently signed-in user, or null. */
  get currentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Signs in with email and password.
   * Throws AuthError with a user-friendly message on failure.
   */
  async signInWithEmail({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      const msg = (err as { message?: string }).message;
      throw new AuthError(mapAuthError(code, msg));
    }
  },

  /**
   * Creates a new account and sets the display name.
   * Throws AuthError with a user-friendly message on failure.
   */
  async registerWithEmail({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }): Promise<void> {
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      await updateProfile(credential.user, { displayName: name.trim() });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      const msg = (err as { message?: string }).message;
      throw new AuthError(mapAuthError(code, msg));
    }
  },

  /** Signs out the current user. */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },
};
