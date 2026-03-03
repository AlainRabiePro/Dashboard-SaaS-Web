"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function CollaboratorsPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch('/api/team', {
          headers: { 'x-user-id': user.uid }
        });
        const data = await response.json();
        setMembers(data.members || []);
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [user?.uid]);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner': return 'bg-blue-500/20 text-blue-400';
      case 'admin': return 'bg-green-500/20 text-green-400';
      case 'editor': return 'bg-amber-500/20 text-amber-400';
      case 'viewer': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'owner': 'Propriétaire',
      'admin': 'Admin',
      'editor': 'Éditeur',
      'viewer': 'Lecteur'
    };
    return labels[role.toLowerCase()] || role;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Collaborateurs</h1>
        <p className="text-muted-foreground italic">Gérez les accès et les permissions de votre équipe.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle>Membres actifs</CardTitle>
              </div>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Inviter</Button>
            </div>
            <CardDescription>Votre équipe SaasFlow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucun membre dans l'équipe</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="p-4 rounded-md border border-white/5 bg-white/2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(member.role)}>{getRoleLabel(member.role)}</Badge>
                      {member.role !== 'owner' && <Button size="sm" variant="ghost"><Trash2 className="h-3 w-3" /></Button>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Rôles et permissions</CardTitle>
            <CardDescription>Définir les niveaux d'accès</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-2">
              <div className="p-3 rounded-md border border-white/5 bg-white/2">
                <p className="font-semibold text-sm text-blue-400">Propriétaire</p>
                <p className="text-xs text-muted-foreground mt-1">Accès complet à tous les outils et paramètres</p>
              </div>
              <div className="p-3 rounded-md border border-white/5 bg-white/2">
                <p className="font-semibold text-sm text-green-400">Admin</p>
                <p className="text-xs text-muted-foreground mt-1">Gestion complète sauf facturation</p>
              </div>
              <div className="p-3 rounded-md border border-white/5 bg-white/2">
                <p className="font-semibold text-sm text-amber-400">Éditeur</p>
                <p className="text-xs text-muted-foreground mt-1">Déployer et gérer les sites</p>
              </div>
              <div className="p-3 rounded-md border border-white/5 bg-white/2">
                <p className="font-semibold text-sm text-gray-400">Lecteur</p>
                <p className="text-xs text-muted-foreground mt-1">Accès en lecture seule</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
