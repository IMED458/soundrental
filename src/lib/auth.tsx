import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, updatePassword, reauthenticateWithCredential,
  EmailAuthProvider, type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from './firebase';
import type { AdminUser } from './types';

interface AuthValue {
  user: User | null;
  profile: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  can: (action: 'manageUsers' | 'manageSettings' | 'manageContent') => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

const ATTEMPT_KEY = 'sr_login_attempts';
const MAX_ATTEMPTS = 6;
const LOCKOUT_MS = 5 * 60 * 1000;

function readAttempts(): { count: number; until: number } {
  try { return JSON.parse(localStorage.getItem(ATTEMPT_KEY) || '') ?? { count: 0, until: 0 }; }
  catch { return { count: 0, until: 0 }; }
}
function writeAttempts(v: { count: number; until: number }) {
  try { localStorage.setItem(ATTEMPT_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseConfigured) { setLoading(false); return; }
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'adminUsers', u.uid));
          setProfile(snap.exists() ? ({ id: snap.id, ...(snap.data() as object) } as AdminUser) : null);
          if (snap.exists()) {
            void setDoc(doc(db, 'adminUsers', u.uid), { lastLoginAt: Date.now() }, { merge: true });
          }
        } catch (e) {
          console.error('admin profile', e);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    const attempts = readAttempts();
    if (attempts.until > Date.now()) {
      const mins = Math.ceil((attempts.until - Date.now()) / 60000);
      throw new Error(`Too many failed attempts. Try again in ${mins} min.`);
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const snap = await getDoc(doc(db, 'adminUsers', cred.user.uid));
      const data = snap.data() as AdminUser | undefined;
      if (!snap.exists() || data?.active === false) {
        await signOut(auth);
        throw new Error('This account does not have admin access.');
      }
      writeAttempts({ count: 0, until: 0 });
    } catch (e) {
      const next = attempts.count + 1;
      writeAttempts({ count: next, until: next >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0 });
      const msg = e instanceof Error ? e.message : 'Login failed';
      setError(msg.replace('Firebase: ', ''));
      throw e;
    }
  };

  const logout = async () => { await signOut(auth); };
  const resetPassword = async (email: string) => { await sendPasswordResetEmail(auth, email.trim()); };

  const changePassword = async (current: string, next: string) => {
    if (!auth.currentUser?.email) throw new Error('Not signed in');
    const cred = EmailAuthProvider.credential(auth.currentUser.email, current);
    await reauthenticateWithCredential(auth.currentUser, cred);
    await updatePassword(auth.currentUser, next);
  };

  const can: AuthValue['can'] = (action) => {
    if (!profile || profile.active === false) return false;
    if (profile.role === 'superadmin') return true;
    if (profile.role === 'admin') return action !== 'manageUsers';
    return action === 'manageContent';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, login, logout, resetPassword, changePassword, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
