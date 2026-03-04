import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Collaborator } from '@/lib/collaborator-service';

export function useCollaborators() {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/collaborators', {
        headers: { 'x-user-id': user.uid },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collaborators');
      }

      const data = await response.json();
      setCollaborators(data.collaborators || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const inviteCollaborator = useCallback(
    async (email: string, name: string, role: string) => {
      if (!user?.uid) return null;

      try {
        const response = await fetch('/api/collaborators', {
          method: 'POST',
          headers: {
            'x-user-id': user.uid,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, name, role }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to invite collaborator');
        }

        const data = await response.json();
        await fetchCollaborators();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        throw new Error(message);
      }
    },
    [user?.uid, fetchCollaborators]
  );

  const updateCollaboratorRole = useCallback(
    async (collaboratorId: string, role: string) => {
      if (!user?.uid) return false;

      try {
        const response = await fetch('/api/collaborators', {
          method: 'PATCH',
          headers: {
            'x-user-id': user.uid,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ collaboratorId, role }),
        });

        if (response.ok) {
          await fetchCollaborators();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error updating collaborator:', err);
        return false;
      }
    },
    [user?.uid, fetchCollaborators]
  );

  const deleteCollaborator = useCallback(
    async (collaboratorId: string) => {
      if (!user?.uid) return false;

      try {
        const response = await fetch('/api/collaborators', {
          method: 'DELETE',
          headers: {
            'x-user-id': user.uid,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ collaboratorId }),
        });

        if (response.ok) {
          await fetchCollaborators();
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error deleting collaborator:', err);
        return false;
      }
    },
    [user?.uid, fetchCollaborators]
  );

  return {
    collaborators,
    loading,
    error,
    fetchCollaborators,
    inviteCollaborator,
    updateCollaboratorRole,
    deleteCollaborator,
  };
}
