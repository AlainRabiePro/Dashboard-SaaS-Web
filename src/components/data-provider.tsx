'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, Subscription, UsageStats } from '@/lib/types';

interface DataContextType {
  projects: Project[] | undefined;
  subscription: Subscription | undefined;
  usage: UsageStats | undefined;
  loading: boolean;
  error?: any;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();

  const projectsQuery = user ? query(collection(db, 'users', user.uid, 'projects'), orderBy('createdAt', 'desc')) : null;
  const subscriptionRef = user ? doc(db, `users/${user.uid}/subscription/current`) : null;
  const usageRef = user ? doc(db, `users/${user.uid}/usage/current`) : null;

  const [projects, projectsLoading, projectsError] = useCollectionData(projectsQuery, { idField: 'id' });
  const [subscription, subscriptionLoading, subscriptionError] = useDocumentData(subscriptionRef);
  const [usage, usageLoading, usageError] = useDocumentData(usageRef);
  
  const loading = authLoading || projectsLoading || subscriptionLoading || usageLoading;
  const error = projectsError || subscriptionError || usageError;

  const value = useMemo(() => ({
    projects: projects as Project[] | undefined,
    subscription: subscription as Subscription | undefined,
    usage: usage as UsageStats | undefined,
    loading,
    error,
  }), [projects, subscription, usage, loading, error]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
