import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

export interface MonitoringMetric {
  id: string;
  siteId: string;
  timestamp: Date;
  uptime: number; // percentage
  latency: number; // ms
  errorRate: number; // percentage
  requestsPerSecond: number;
}

export interface SiteMetrics {
  siteId: string;
  siteName: string;
  currentUptime: number;
  currentLatency: number;
  currentErrorRate: number;
  metrics: MonitoringMetric[];
}

export function useMonitoringMetrics(siteId?: string) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [metrics, setMetrics] = useState<MonitoringMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !firestore || !siteId) {
      setMetrics([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const metricsRef = collection(
        firestore,
        'monitoring',
        siteId,
        'metrics'
      );
      
      // Récupérer les 100 dernières métriques (environ 1h30 avec un point toutes les 54s)
      const q = query(
        metricsRef,
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs
            .map(doc => {
              const docData = doc.data();
              return {
                id: doc.id,
                siteId: docData.siteId || siteId,
                timestamp: docData.timestamp?.toDate?.() || new Date(),
                uptime: docData.uptime || 100,
                latency: docData.latency || 0,
                errorRate: docData.errorRate || 0,
                requestsPerSecond: docData.requestsPerSecond || 0,
              } as MonitoringMetric;
            })
            .reverse(); // Inverser pour avoir l'ordre chronologique (ancien -> récent)

          setMetrics(data);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching metrics:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('Error setting up metrics query:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [user, firestore, siteId]);

  // Calculer les stats actuelles
  const currentMetrics = useMemo(() => {
    if (metrics.length === 0) {
      return {
        uptime: 100,
        latency: 50,
        errorRate: 0,
        requestsPerSecond: 0,
      };
    }

    const latest = metrics[metrics.length - 1];
    const avgLatency =
      metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;

    return {
      uptime: latest.uptime,
      latency: Math.round(avgLatency),
      errorRate: latest.errorRate,
      requestsPerSecond: latest.requestsPerSecond,
    };
  }, [metrics]);

  return {
    metrics,
    currentMetrics,
    loading,
    error,
  };
}

// Hook pour tous les sites d'un utilisateur
export function useAllSitesMetrics() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [siteMetrics, setSiteMetrics] = useState<SiteMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      setSiteMetrics([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Récupérer les projets de l'utilisateur d'abord
      const projectsRef = collection(firestore, 'projects');
      const q = query(projectsRef, where('userId', '==', user.uid));

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const sites = snapshot.docs;
          const allMetrics: SiteMetrics[] = [];

          for (const siteDoc of sites) {
            const siteData = siteDoc.data();
            const metricsRef = collection(
              firestore,
              'monitoring',
              siteDoc.id,
              'metrics'
            );
            const metricsQuery = query(
              metricsRef,
              orderBy('timestamp', 'desc'),
              limit(1)
            );

            const metricsSnapshot = await new Promise<any>((resolve) => {
              onSnapshot(metricsQuery, resolve);
            });

            const latestMetric = metricsSnapshot.docs[0]?.data() || {
              uptime: 100,
              latency: 50,
              errorRate: 0,
            };

            allMetrics.push({
              siteId: siteDoc.id,
              siteName: siteData.name,
              currentUptime: latestMetric.uptime,
              currentLatency: latestMetric.latency,
              currentErrorRate: latestMetric.errorRate,
              metrics: [],
            });
          }

          setSiteMetrics(allMetrics);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err: unknown) {
      console.error('Error fetching all sites metrics:', err);
      setLoading(false);
    }
  }, [user, firestore]);

  return { siteMetrics, loading };
}

// Fonction pour sauvegarder une métrique
export async function saveMonitoringMetric(
  siteId: string,
  metric: Omit<MonitoringMetric, 'id' | 'siteId'>
) {
  try {
    const response = await fetch('/api/monitoring/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        siteId,
        ...metric,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save metric');
    }

    return response.json();
  } catch (error) {
    console.error('Error saving metric:', error);
    throw error;
  }
}
