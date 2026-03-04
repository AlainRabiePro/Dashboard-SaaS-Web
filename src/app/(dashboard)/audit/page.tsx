'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { AuditLogItem } from '@/components/audit-log-item';
import { AuditLogsStats } from '@/components/audit-logs-stats';

export default function AuditPage() {
  const { user, loading: userLoading } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projectsLoading, setProjectsLoading] = useState(true);
  const { logs, stats, loading, error } = useAuditLogs(30);

  const isReady = !userLoading && user;

  // Fetch projects
  useEffect(() => {
    if (!user?.uid) return;

    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
        const response = await fetch('/api/console/projects', {
          headers: { 'x-user-id': user.uid },
        });

        if (!response.ok) throw new Error('Failed to fetch projects');

        const data = await response.json();
        setProjects(data.projects || []);

        // Select first project by default
        if (data.projects?.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [user?.uid]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground italic">
          Suivi complet de toutes les actions effectuées sur votre compte.
        </p>
      </div>

      {isReady ? (
        <>
          {/* Project Selector */}
          {!projectsLoading && projects.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium whitespace-nowrap">Sélectionner un projet:</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name || project.domain || project.id}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <AuditLogsStats
            logins={stats.logins}
            deployments={stats.deployments}
            modifications={stats.modifications}
            deletions={stats.deletions}
          />

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <CardTitle>Activité récente</CardTitle>
                  <CardDescription>Derniers 30 jours</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                  <strong>Erreur:</strong> {error}
                </div>
              )}

              {!loading && !error && logs.length > 0 && (
                <div className="divide-y">
                  {logs.map((log) => (
                    <AuditLogItem key={log.id} log={log} />
                  ))}
                </div>
              )}

              {!loading && !error && logs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun log pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
