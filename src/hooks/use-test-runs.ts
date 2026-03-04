import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

export interface TestRun {
  id: string;
  suiteId: string;
  date: string;
  status: 'passed' | 'failed' | 'running';
  duration: number;
  passed: number;
  failed: number;
  total: number;
  commitHash?: string;
  commitMessage?: string;
  createdAt?: Date;
}

export function useTestRuns(limit_count: number = 20) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !firestore) {
      setTestRuns([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const testsRef = collection(firestore, 'users', user.uid, 'testRuns');
      const q = query(
        testsRef,
        orderBy('createdAt', 'desc'),
        limit(limit_count)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            return {
              id: doc.id,
              suiteId: docData.suiteId,
              date: docData.date || new Date().toLocaleString('fr-FR'),
              status: docData.status || 'running',
              duration: docData.duration || 0,
              passed: docData.passed || 0,
              failed: docData.failed || 0,
              total: docData.total || 0,
              commitHash: docData.commitHash,
              commitMessage: docData.commitMessage,
              createdAt: docData.createdAt?.toDate?.() || new Date(),
            } as TestRun;
          });

          setTestRuns(data);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching test runs:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('Error setting up test runs query:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [user, firestore, limit_count]);

  return { testRuns, loading, error };
}

export async function createTestRun(
  userId: string,
  testData: Omit<TestRun, 'id'>
) {
  // Cette fonction devrait être appelée depuis une API route
  // pour éviter d'exposer les credentials Firestore
  const response = await fetch('/api/tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      ...testData,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create test run');
  }

  return response.json();
}
