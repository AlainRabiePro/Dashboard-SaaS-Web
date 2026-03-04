"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommitsList } from "@/components/commits-list";

export default function DeploymentsPage() {
  const { user } = useAuth();
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.uid) return;

      try {
        const response = await fetch('/api/console/projects', {
          headers: { 'x-user-id': user.uid }
        });
        const data = await response.json();
        setProjects(data.projects || []);
        if (data.projects?.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [user?.uid]);

  // Fetch deployments
  useEffect(() => {
    const fetchDeployments = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/deployments', {
          headers: {
            'x-user-id': user.uid,
          }
        });
        const data = await response.json();
        setDeployments(data.deployments || []);
      } catch (error) {
        console.error('Error fetching deployments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'in-progress':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400">Succès</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400">Échoué</Badge>;
      case 'in-progress':
        return <Badge className="bg-amber-500/20 text-amber-400">En cours</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Déploiements</h1>
        <p className="text-muted-foreground italic">Suivez l'historique de vos déploiements et gérez les versions.</p>
      </div>

      <div className="grid gap-6">
        {/* Commits by Project */}
        {projects.length > 0 && (
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sélectionner un projet</CardTitle>
              </div>
              <CardDescription>Afficher les commits récents</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="bg-white/5 border-white/10 max-w-xs">
                  <SelectValue placeholder="Choisir un projet..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Commits List */}
        {selectedProject && (
          <CommitsList
            repoUrl={projects.find(p => p.id === selectedProject)?.repositoryUrl}
            title="Commits récents du projet"
            maxCommits={10}
          />
        )}

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Historique des déploiements</CardTitle>
              <Button size="sm" variant="outline">Nouveau déploiement</Button>
            </div>
            <CardDescription>Derniers déploiements de vos sites</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : deployments.length > 0 ? (
              <div className="space-y-3">
                {deployments.map((deployment: any) => (
                  <div key={deployment.id} className="p-4 rounded-md border border-white/5 bg-white/2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(deployment.status)}
                        <p className="font-semibold text-sm">{deployment.siteName || deployment.domain}</p>
                      </div>
                      {getStatusBadge(deployment.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{deployment.version || 'v1.0.0'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(deployment.timestamp)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun déploiement pour le moment</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Statut global</CardTitle>
            <CardDescription>Santé de vos déploiements</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-md border border-green-500/20 bg-green-500/5">
              <p className="text-sm text-muted-foreground">Succès</p>
              <p className="text-2xl font-bold text-green-400">
                {deployments.filter(d => d.status === 'success').length}
              </p>
            </div>
            <div className="p-4 rounded-md border border-amber-500/20 bg-amber-500/5">
              <p className="text-sm text-muted-foreground">En cours</p>
              <p className="text-2xl font-bold text-amber-400">
                {deployments.filter(d => d.status === 'in-progress').length}
              </p>
            </div>
            <div className="p-4 rounded-md border border-red-500/20 bg-red-500/5">
              <p className="text-sm text-muted-foreground">Échoués</p>
              <p className="text-2xl font-bold text-red-400">
                {deployments.filter(d => d.status === 'failed').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
