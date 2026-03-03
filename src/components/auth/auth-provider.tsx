'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: typeof createUserWithEmailAndPassword;
  signIn: typeof signInWithEmailAndPassword;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = useMemo(() => ({
    user,
    loading,
    signUp: createUserWithEmailAndPassword,
    signIn: signInWithEmailAndPassword,
    signOut,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
