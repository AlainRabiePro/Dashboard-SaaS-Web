import { useState, useCallback, useEffect } from 'react';

interface TestResult {
  id: string;
  name?: string;
  suiteId?: string;
  status: 'passed' | 'failed' | 'running';
  passed: number;
  failed: number;
  total: number;
  duration: number;
  date: string;
  commitHash?: string;
  commitMessage?: string;
  deploymentId?: string;
}

interface UseTestsResult {
  results: TestResult[];
  loading: boolean;
  error: string | null;
  runTests: (siteId: string, suiteId: string, userId: string) => Promise<void>;
  fetchGitHubResults: (owner: string, repo: string, token?: string, workflow?: string) => Promise<void>;
  clearError: () => void;
}

export function useTests(): UseTestsResult {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Exécuter les tests via l'API backend
  const runTests = useCallback(async (siteId: string, suiteId: string, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/run-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          suiteId,
          userId,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error: string };
        throw new Error(data.error || 'Failed to run tests');
      }

      const result = (await response.json()) as TestResult;
      setResults(prev => [result, ...prev].slice(0, 50)); // Keep last 50 results
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les résultats depuis GitHub Actions
  const fetchGitHubResults = useCallback(
    async (owner: string, repo: string, token?: string, workflow?: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          owner,
          repo,
          limit: '10',
        });

        if (token) params.append('token', token);
        if (workflow) params.append('workflow', workflow);

        const response = await fetch(`/api/github-test-results?${params.toString()}`);

        if (!response.ok) {
          const data = (await response.json()) as { error: string };
          throw new Error(data.error || 'Failed to fetch GitHub results');
        }

        const data = (await response.json()) as { runs: TestResult[] };
        setResults(data.runs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    results,
    loading,
    error,
    runTests,
    fetchGitHubResults,
    clearError,
  };
}
