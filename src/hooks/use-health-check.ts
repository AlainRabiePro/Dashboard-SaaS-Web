import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface HealthCheckResult {
  success: boolean;
  checked: number;
  results: any[];
}

export function useHealthCheck() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerHealthCheck = useCallback(async () => {
    if (!user?.uid) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/health-check', {
        method: 'POST',
        headers: { 'x-user-id': user.uid },
      });

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      const data: HealthCheckResult = await response.json();
      setLastCheck(new Date());
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Auto health check every 5 minutes
  useEffect(() => {
    if (!user?.uid) return;

    // Premier check immédiatement
    triggerHealthCheck();

    // Puis tous les 5 minutes
    const interval = setInterval(() => {
      triggerHealthCheck();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.uid, triggerHealthCheck]);

  return {
    triggerHealthCheck,
    loading,
    lastCheck,
    error,
  };
}
