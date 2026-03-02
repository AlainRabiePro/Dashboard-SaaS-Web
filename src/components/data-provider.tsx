'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, doc } from 'firebase/firestore';
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

  const projectsCollection = user ? collection(db, 'users', user.uid, 'projects') : null;
  const subscriptionRef = user ? doc(db, `users/${user.uid}/subscription/current`) : null;
  const usageRef = user ? doc(db, `users/${user.uid}/usage/current`) : null;

  const [projects, projectsLoading, projectsError] = useCollectionData(projectsCollection, { idField: 'id' });
  const [subscription, subscriptionLoading, subscriptionError] = useDocumentData(subscriptionRef);
  const [usage, usageLoading, usageError] = useDocumentData(usageRef);
  
  const loading = authLoading || projectsLoading || subscriptionLoading || usageLoading;
  const error = projectsError || subscriptionError || usageError;

  const sortedProjects = useMemo(() => {
    if (!projects) return undefined;
    
    const projectsCopy = [...(projects as Project[])];
    
    projectsCopy.sort((a, b) => {
        // Handle cases where createdAt is null, undefined, or a pending server timestamp.
        const timeA = a.createdAt?.toMillis?.() ?? 0;
        const timeB = b.createdAt?.toMillis?.() ?? 0;

        // If a timestamp is pending, its time will be 0. We want pending items to appear first.
        // We can treat them as "newer" than any existing item by giving them the current time.
        const effectiveTimeA = timeA === 0 && a.id ? Date.now() : timeA;
        const effectiveTimeB = timeB === 0 && b.id ? Date.now() : timeB;
        
        return effectiveTimeB - effectiveTimeA; // Sort descending
    });
    return projectsCopy;
  }, [projects]);

  const value = useMemo(() => ({
    projects: sortedProjects,
    subscription: subscription as Subscription | undefined,
    usage: usage as UsageStats | undefined,
    loading,
    error,
  }), [sortedProjects, subscription, usage, loading, error]);

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
