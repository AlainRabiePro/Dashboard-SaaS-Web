"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, Settings, Loader2, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: string;
  channel: 'email' | 'sms';
  timestamp: string;
  read: boolean;
}

interface Preferences {
  email: string;
  phone: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({ email: '', phone: '', emailEnabled: false, smsEnabled: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Preferences>({ email: '', phone: '', emailEnabled: false, smsEnabled: false });

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch('/api/notifications', {
          headers: { 'x-user-id': user.uid }
        });
        const data = await response.json();
        setNotifications(data.notifications || []);
        setPreferences(data.preferences || { email: '', phone: '', emailEnabled: false, smsEnabled: false });
        setFormData(data.preferences || { email: '', phone: '', emailEnabled: false, smsEnabled: false });
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.uid]);

  const handleSavePreferences = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'x-user-id': user.uid,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        setPreferences(formData);
        alert('Préférences sauvegardées avec succès !');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

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

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
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
        {/* Préférences de contact */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              <CardTitle>Canaux de notification</CardTitle>
            </div>
            <CardDescription>Configurez vos préférences d'envoi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="p-4 rounded-md border border-white/5 bg-white/2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-semibold text-sm">E-mail</p>
                    <p className="text-xs text-muted-foreground">Recevoir les notifications par email</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.emailEnabled}
                  onChange={(e) => setFormData({...formData, emailEnabled: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>
              <input 
                type="email" 
                placeholder="votre@email.com"
                disabled={!formData.emailEnabled}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-white/10 text-white text-sm disabled:opacity-50"
              />
            </div>

            {/* SMS */}
            <div className="p-4 rounded-md border border-white/5 bg-white/2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-semibold text-sm">SMS</p>
                    <p className="text-xs text-muted-foreground">Recevoir les notifications par SMS</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.smsEnabled}
                  onChange={(e) => setFormData({...formData, smsEnabled: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>
              <input 
                type="tel" 
                placeholder="+33 6 12 34 56 78"
                disabled={!formData.smsEnabled}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-white/10 text-white text-sm disabled:opacity-50"
              />
            </div>

            <Button 
              onClick={handleSavePreferences} 
              disabled={saving}
              className="w-full"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sauvegarder les préférences
            </Button>
          </CardContent>
        </Card>

        {/* Historique des notifications */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <CardTitle>Historique</CardTitle>
              </div>
            </div>
            <CardDescription>Dernières notifications envoyées</CardDescription>
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
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{getTypeIcon(notif.type)} {notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getChannelIcon(notif.channel)}
                        {notif.channel === 'email' ? 'Email' : 'SMS'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTime(notif.timestamp)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
