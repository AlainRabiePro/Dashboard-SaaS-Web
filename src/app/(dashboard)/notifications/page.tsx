"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, Settings, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch('/api/notifications', {
          headers: { 'x-user-id': user.uid }
        });
        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.uid]);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return '🔄';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  const getTypeBorder = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success': return 'border-green-500/20 bg-green-500/5';
      case 'warning': return 'border-amber-500/20 bg-amber-500/5';
      case 'info': return 'border-blue-500/20 bg-blue-500/5';
      case 'error': return 'border-red-500/20 bg-red-500/5';
      default: return 'border-purple-500/20 bg-purple-500/5';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground italic">Gérez vos alertes et préférences de notifications.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <Button size="sm" variant="outline">Marquer comme lues</Button>
            </div>
            <CardDescription>Alertes et mises à jour</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucune notification</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`p-4 rounded-md border ${getTypeBorder(notif.type)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{getTypeIcon(notif.type)} {notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.description}</p>
                    </div>
                    <Button size="sm" variant="ghost"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTime(notif.timestamp)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <CardTitle>Préférences</CardTitle>
            </div>
            <CardDescription>Choisissez ce dont vous voulez être notifié</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
              <p className="text-sm">Alertes de déploiement</p>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
              <p className="text-sm">Notifications de performance</p>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
              <p className="text-sm">Mises à jour de plan</p>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
              <p className="text-sm">Newsletter hebdomadaire</p>
              <input type="checkbox" className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
