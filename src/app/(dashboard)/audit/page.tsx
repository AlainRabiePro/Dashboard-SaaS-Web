"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function AuditPage() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/audit-logs', {
          headers: {
            'x-user-id': user.uid,
          }
        });
        const data = await response.json();
        setAuditLogs(data.auditLogs || []);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [user]);

  const actionTypeIcon: Record<string, { color: string; bg: string }> = {
    'LOGIN': { color: 'text-blue-500', bg: 'bg-blue-500/10' },
    'DEPLOY': { color: 'text-green-500', bg: 'bg-green-500/10' },
    'SETTINGS': { color: 'text-amber-500', bg: 'bg-amber-500/10' },
    'API': { color: 'text-purple-500', bg: 'bg-purple-500/10' },
    'DELETE': { color: 'text-red-500', bg: 'bg-red-500/10' },
    'CREATE': { color: 'text-green-500', bg: 'bg-green-500/10' },
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
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground italic">Suivi complet de toutes les actions effectuées sur votre compte.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <CardTitle>Activité récente</CardTitle>
            </div>
            <CardDescription>Derniers 30 jours</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log: any) => {
                  const actionType = log.actionType || 'OTHER';
                  const style = actionTypeIcon[actionType] || { color: 'text-gray-500', bg: 'bg-gray-500/10' };
                  
                  return (
                    <div key={log.id} className="p-4 rounded-md border border-white/5 bg-white/2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${style.bg} ${style.color} h-fit text-xs`}>
                          {actionType}
                        </Badge>
                        <p className="font-semibold text-sm">{log.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{log.details}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(log.timestamp)}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun log pour le moment</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
            <CardDescription>Résumé de vos activités</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-md border border-white/5 bg-white/2">
              <p className="text-sm text-muted-foreground">Connexions</p>
              <p className="text-2xl font-bold">
                {auditLogs.filter(l => l.actionType === 'LOGIN').length}
              </p>
            </div>
            <div className="p-4 rounded-md border border-white/5 bg-white/2">
              <p className="text-sm text-muted-foreground">Déploiements</p>
              <p className="text-2xl font-bold">
                {auditLogs.filter(l => l.actionType === 'DEPLOY').length}
              </p>
            </div>
            <div className="p-4 rounded-md border border-white/5 bg-white/2">
              <p className="text-sm text-muted-foreground">Modifications</p>
              <p className="text-2xl font-bold">
                {auditLogs.filter(l => l.actionType === 'SETTINGS').length}
              </p>
            </div>
            <div className="p-4 rounded-md border border-white/5 bg-white/2">
              <p className="text-sm text-muted-foreground">Suppressions</p>
              <p className="text-2xl font-bold">
                {auditLogs.filter(l => l.actionType === 'DELETE').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
