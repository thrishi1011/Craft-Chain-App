import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { generateId } from '@/utils/helpers';
import { saveUsers, loadUsers } from '@/utils/storage';
import { auth, googleProvider } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (form: { username: string; email: string; password: string; role: User['role'] }) => Promise<{ success: boolean; errors?: Record<string, string> }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => loadUsers() || []);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync users to storage
  useEffect(() => {
    saveUsers(users);
  }, [users]);

  // Sync with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // If it's a password user, we check if email is verified
        const isPasswordProvider = firebaseUser.providerData.some(p => p.providerId === 'password');

        if (isPasswordProvider && !firebaseUser.emailVerified) {
          setCurrentUser(null); // Keep locally logged out if not verified
          setLoading(false);
          return;
        }

        // Map Firebase user to our local User object
        const existingUser = users.find(u => u.id === firebaseUser.uid || u.email === firebaseUser.email);
        if (existingUser) {
          setCurrentUser(existingUser);
        } else {
          // If user exists in Firebase but not in our list (e.g. Google login for first time)
          const newUser: User = {
            id: firebaseUser.uid,
            username: firebaseUser.displayName?.replace(/\s+/g, '') || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            password: '', // Not used for Firebase
            role: 'Miner',
            createdAt: new Date(),
          };
          setUsers(prev => [...prev, newUser]);
          setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [users]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        return { success: false, error: 'Please verify your email before logging in.' };
      }
      return { success: true };
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') return { success: false, error: 'Invalid email or password' };
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (form: { username: string; email: string; password: string; role: User['role'] }) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // Send verification email
      await sendEmailVerification(result.user);

      const newUser: User = {
        id: result.user.uid,
        username: form.username,
        email: form.email,
        password: '', // Secure
        role: form.role,
        createdAt: new Date(),
      };
      setUsers(prev => [...prev, newUser]);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') return { success: false, errors: { email: 'Email already registered' } };
      return { success: false, errors: { general: error.message } };
    }
  };

  const resendVerification = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      }
      return { success: false, error: 'No user to send verification to' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Google login failed' };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, loginWithGoogle, logout, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
};
