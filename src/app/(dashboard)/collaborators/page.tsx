"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { InviteCollaboratorDialog } from "@/components/invite-collaborator-dialog";
import { CollaboratorRow } from "@/components/collaborator-row";
import { RolePermissionsDisplay } from "@/components/role-permissions-display";
import { CollaboratorsPaywall } from "@/components/CollaboratorsPaywall";
import { type Collaborator } from "@/lib/collaborator-service";

export default function CollaboratorsPage() {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresAddon, setRequiresAddon] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const fetchCollaborators = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      
      // Récupérer les collaborateurs
      const response = await fetch('/api/collaborators', {
        headers: { 'x-user-id': user.uid }
      });
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators || []);
      }
      
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchCollaborators();
    }
  }, [user?.uid]);

  const handleCollaboratorUpdate = () => {
    fetchCollaborators();
  };

  const handleCollaboratorDelete = () => {
    fetchCollaborators();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Collaborateurs</h1>
        <p className="text-muted-foreground italic">Gérez les accès et les permissions de votre équipe.</p>
      </div>

      <div className="grid gap-6">
        {/* Paywall pour plus de 3 collaborateurs */}
        {collaborators.length >= 3 && !requiresAddon && (
          <CollaboratorsPaywall 
            addonPrice={2}
            onSubscribe={() => {
              window.location.href = '/billing/addons/collaborators';
            }}
          />
        )}

        {/* Membres actifs */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <CardTitle>Membres actifs ({collaborators.length})</CardTitle>
                  <CardDescription>Votre équipe SaasFlow</CardDescription>
                </div>
              </div>
              {user?.uid && collaborators.length < 3 && (
                <InviteCollaboratorDialog
                  userId={user.uid}
                  onInvite={handleCollaboratorUpdate}
                />
              )}
              {user?.uid && collaborators.length >= 3 && (
                <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded">
                  Limite de 3 collaborateurs atteinte. Passez à l'add-on pour plus.
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun collaborateur pour le moment. Invitez quelqu'un pour commencer!
              </div>
            ) : (
              collaborators.map((collaborator) => (
                <CollaboratorRow
                  key={collaborator.id}
                  collaborator={collaborator}
                  userId={user?.uid || ''}
                  onUpdate={handleCollaboratorUpdate}
                  onDelete={handleCollaboratorDelete}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Rôles et permissions */}
        <RolePermissionsDisplay />
      </div>
    </div>
  );
}
