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
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import auth from '@/lib/firebase/auth';
import db from '@/lib/firebase/firestore';
import storage from '@/lib/firebase/storage';
import type { UserProfile } from '@/types/models';

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
   * Creates a new account, sets the display name, uploads logo, and creates Firestore profile.
   * Throws AuthError with a user-friendly message on failure.
   */
  async registerWithEmail({
    name,
    email,
    password,
    companyName,
    phoneNumber,
    address,
    companyEmail,
    website,
    gstNumber,
    logoFile,
  }: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    phoneNumber: string;
    address: string;
    companyEmail?: string;
    website?: string;
    gstNumber?: string;
    logoFile?: Blob | File;
  }): Promise<void> {
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      
      const user = credential.user;
      await updateProfile(user, { displayName: name.trim() });

      let companyLogoUrl = '';
      let companyLogoPath = '';

      if (logoFile) {
        companyLogoPath = `company-logos/${user.uid}/logo_${Date.now()}.jpg`;
        const logoRef = ref(storage, companyLogoPath);
        await uploadBytes(logoRef, logoFile);
        companyLogoUrl = await getDownloadURL(logoRef);
      }

      const now = new Date().toISOString();
      const userProfile: UserProfile = {
        uid: user.uid,
        displayName: name.trim(),
        email: email.trim(),
        companyName: companyName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        companyEmail: companyEmail?.trim() || '',
        website: website?.trim() || '',
        gstNumber: gstNumber?.trim() || '',
        companyLogoUrl,
        companyLogoPath,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      const msg = (err as { message?: string }).message;
      throw new AuthError(mapAuthError(code, msg));
    }
  },

  /**
   * Updates an existing user profile, optionally replacing the logo.
   */
  async updateUserProfile(
    uid: string,
    currentProfile: UserProfile,
    updates: Partial<UserProfile>,
    newLogoFile?: Blob | File,
    removeLogo?: boolean
  ): Promise<void> {
    let { companyLogoUrl, companyLogoPath } = currentProfile;

    if (removeLogo || newLogoFile) {
      // Delete old logo if it exists
      if (companyLogoPath) {
        try {
          const oldLogoRef = ref(storage, companyLogoPath);
          await deleteObject(oldLogoRef);
        } catch (e) {
          console.warn('Failed to delete old logo', e);
        }
      }
      companyLogoUrl = '';
      companyLogoPath = '';
    }

    if (newLogoFile) {
      companyLogoPath = `company-logos/${uid}/logo_${Date.now()}.jpg`;
      const logoRef = ref(storage, companyLogoPath);
      await uploadBytes(logoRef, newLogoFile);
      companyLogoUrl = await getDownloadURL(logoRef);
    }

    const updatedData = {
      ...updates,
      companyLogoUrl,
      companyLogoPath,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, 'users', uid), updatedData);
    
    if (updates.displayName && auth.currentUser) {
       await updateProfile(auth.currentUser, { displayName: updates.displayName });
    }
  },

  /** Signs out the current user. */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },
};
