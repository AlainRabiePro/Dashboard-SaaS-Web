'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { ShareInvitationLink } from '@/components/ShareInvitationLink';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';

export default function SiteCollaboratorsPage() {
  const { user } = useAuth();
  const params = useParams();
  const siteId = params.siteId as string;
  const [site, setSite] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !siteId) return;

    const fetchSiteAndCollaborators = async () => {
      try {
        setLoading(true);

        // Récupérer les infos du site
        const siteResponse = await fetch(`/api/sites/${siteId}`, {
          headers: { 'x-user-id': user.uid },
        });

        if (siteResponse.ok) {
          const siteData = await siteResponse.json();
          setSite(siteData);
        }

        // Récupérer les collaborateurs du site
        const collabResponse = await fetch('/api/collaborators', {
          headers: {
            'x-user-id': user.uid,
            'x-project-id': siteId,
          },
        });

        if (collabResponse.ok) {
          const data = await collabResponse.json();
          setCollaborators(data.collaborators || []);
        }
      } catch (error) {
        console.error('Error fetching site collaborators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSiteAndCollaborators();
  }, [user?.uid, siteId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Collaborateurs - {site?.name || 'Chargement...'}
        </h1>
        <p className="text-muted-foreground italic">
          Gérez les collaborateurs de ce projet
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Lien d'invitation partageable */}
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Lien d'invitation</CardTitle>
              <CardDescription>
                Générez un lien d'invitation partageable pour ce projet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.uid && siteId && (
                <ShareInvitationLink
                  projectId={siteId}
                  projectName={site?.name || 'Mon Projet'}
                />
              )}
            </CardContent>
          </Card>

          {/* Collaborateurs actuels */}
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <CardTitle>Collaborateurs actifs</CardTitle>
                  <CardDescription>
                    {collaborators.length} collaborateur(s)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {collaborators.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun collaborateur pour le moment.
                </div>
              ) : (
                collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div>
                      <p className="font-medium">{collaborator.name}</p>
                      <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100/20 text-green-300 rounded">
                      {collaborator.status === 'active' ? 'Actif' : 'En attente'}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
