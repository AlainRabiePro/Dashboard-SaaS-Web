import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { type Invoice } from '@/lib/invoice-service';

interface UseInvoicesReturn {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInvoices(): UseInvoicesReturn {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/invoices', {
        headers: {
          'x-user-id': user.uid,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Failed to fetch invoices:', errorMsg);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const refetch = useCallback(async () => {
    await fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    refetch,
  };
}
