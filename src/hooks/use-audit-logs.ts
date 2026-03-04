import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuditLogEntry } from '@/lib/audit-log-service';

interface UseAuditLogsReturn {
  logs: AuditLogEntry[];
  stats: {
    logins: number;
    deployments: number;
    modifications: number;
    deletions: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createLog: (
    action: string,
    description: string,
    metadata?: any
  ) => Promise<AuditLogEntry | null>;
}

export function useAuditLogs(days: number = 30): UseAuditLogsReturn {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState({
    logins: 0,
    deployments: 0,
    modifications: 0,
    deletions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    // Don't fetch if user is not available
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/audit-logs?limit=100&days=${days}`, {
        headers: {
          'x-user-id': user.uid,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}`;
        throw new Error(`Failed to fetch audit logs: ${errorMessage}`);
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setStats(data.stats || stats);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Failed to fetch audit logs:', errorMsg, err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, days]);

  const refetch = useCallback(async () => {
    await fetchLogs();
  }, [fetchLogs]);

  const createLog = useCallback(
    async (
      action: string,
      description: string,
      metadata?: any
    ): Promise<AuditLogEntry | null> => {
      if (!user?.uid) {
        console.warn('Cannot create audit log: user not authenticated');
        return null;
      }

      try {
        const response = await fetch('/api/audit-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.uid,
          },
          body: JSON.stringify({
            action,
            description,
            metadata,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        // Refetch pour mettre à jour la liste
        await fetchLogs();
        return data;
      } catch (err) {
        console.error('Failed to create audit log:', err);
        return null;
      }
    },
    [user?.uid, fetchLogs]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    stats,
    loading,
    error,
    refetch,
    createLog,
  };
}
