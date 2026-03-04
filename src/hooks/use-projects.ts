import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
  domain: string;
  storageUsed: number;
  status: 'Running' | 'Stopped' | 'Error';
  plan: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  deployments?: number;
  lastDeployment?: Date;
}

export function useProjects() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !firestore) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const projectsRef = collection(firestore, 'projects');
      const q = query(projectsRef, where('userId', '==', user.uid));
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            return {
              id: doc.id,
              name: docData.name,
              domain: docData.domain,
              storageUsed: docData.storageUsed || 0,
              status: docData.status || 'Running',
              plan: docData.plan || 'Starter',
              userId: docData.userId,
              createdAt: docData.createdAt?.toDate?.() || new Date(),
              updatedAt: docData.updatedAt?.toDate?.() || new Date(),
              deployments: docData.deployments || 0,
              lastDeployment: docData.lastDeployment?.toDate?.(),
            } as Project;
          });
          
          // Trier par date de création (plus récents en premier)
          data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          
          setProjects(data);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching projects:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('Error setting up projects query:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [user, firestore]);

  return { projects, loading, error };
}

// Hook pour un seul project
export function useProject(projectId: string) {
  const firestore = useFirestore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    try {
      const { doc, onSnapshot } = require('firebase/firestore');
      const docRef = doc(firestore, 'projects', projectId);
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap: any) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProject({
              id: docSnap.id,
              name: data.name,
              domain: data.domain,
              storageUsed: data.storageUsed || 0,
              status: data.status || 'Running',
              plan: data.plan || 'Starter',
              userId: data.userId,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              deployments: data.deployments || 0,
              lastDeployment: data.lastDeployment?.toDate?.(),
            } as Project);
          } else {
            setProject(null);
          }
          setLoading(false);
        },
        (err: Error) => {
          console.error('Error fetching project:', err);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err: unknown) {
      console.error('Error setting up project query:', err);
      setLoading(false);
    }
  }, [firestore, projectId]);

  return { project, loading };
}
