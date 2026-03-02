'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, Subscription, UsageStats } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface DataContextType {
  projects: Project[];
  subscription: Subscription | null;
  usage: UsageStats | null;
  loading: boolean;
  error?: any;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: 'Free',
  monthlyCost: 0,
  storageLimit: 5,
  cpuCores: 1,
  ram: 1,
};

const DEFAULT_USAGE: UsageStats = {
  cpu: 0,
  ram: 0,
  storage: 0,
};

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
    projects: (projects as Project[]) || [],
    subscription: (subscription as Subscription) || DEFAULT_SUBSCRIPTION,
    usage: (usage as UsageStats) || DEFAULT_USAGE,
    loading,
    error,
  }), [projects, subscription, usage, loading, error]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading your data...</p>
      </div>
    );
  }

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
