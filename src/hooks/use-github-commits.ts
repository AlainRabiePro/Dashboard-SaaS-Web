import { useState, useEffect } from 'react';

export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  avatar?: string;
}

export function useGithubCommits(repo?: string, branch?: string) {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);

  const fetchCommits = async (repoUrl: string) => {
    if (!repoUrl) {
      setError('No repository URL provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Extract repo from URL (handles github.com/owner/repo, https://github.com/owner/repo.git, etc)
      const repoMatch = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (!repoMatch) {
        setError('Invalid GitHub repository URL');
        return;
      }

      const owner = repoMatch[1];
      const repoName = repoMatch[2];
      const fullRepo = `${owner}/${repoName}`;

      const response = await fetch('/api/github/commits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repo: fullRepo, 
          branch: branch || 'main' 
        }),
      });

      const data = await response.json();

      if (data.isPrivate) {
        setIsPrivate(true);
      }

      setCommits(data.commits || []);
      if (!response.ok && data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(`Failed to fetch commits: ${String(err)}`);
      setCommits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (repo) {
      fetchCommits(repo);
    }
  }, [repo, branch]);

  return { commits, loading, error, isPrivate, refetch: () => repo && fetchCommits(repo) };
}
