"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Code2, Copy, Trash2, Plus, Loader2, Check, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { copyToClipboard } from "@/lib/clipboard-utils";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  active: boolean;
}

interface Webhook {
  id: string;
  event: string;
  url: string;
  active: boolean;
  createdAt: string;
  lastTriggered?: string | null;
}

export default function ApiPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingKey, setAddingKey] = useState(false);
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [showNewKeyName, setShowNewKeyName] = useState("");
  const [newWebhookEvent, setNewWebhookEvent] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch API Keys and Webhooks
  useEffect(() => {
    fetchData();
  }, [user?.uid]);

  const fetchData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const [keysRes, webhooksRes] = await Promise.all([
        fetch('/api/api-keys', {
          headers: { 'x-user-id': user.uid }
        }),
        fetch('/api/webhooks', {
          headers: { 'x-user-id': user.uid }
        })
      ]);

      const keysData = await keysRes.json();
      const webhooksData = await webhooksRes.json();

      setApiKeys(keysData.keys || []);
      setWebhooks(webhooksData.webhooks || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    if (!showNewKeyName.trim() || !user?.uid) return;

    setAddingKey(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'x-user-id': user.uid,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: showNewKeyName })
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys([...apiKeys, {
          id: data.id,
          name: data.name,
          key: data.key,
          createdAt: new Date().toISOString(),
          active: true
        }]);
        setShowNewKeyName("");
        setSuccessMessage("Clé API créée avec succès!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error('Error adding API key:', error);
    } finally {
      setAddingKey(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!user?.uid) return;

    try {
      const response = await fetch('/api/api-keys', {
        method: 'DELETE',
        headers: {
          'x-user-id': user.uid,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyId })
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter(k => k.id !== keyId));
        setSuccessMessage("Clé API supprimée!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const handleAddWebhook = async () => {
    if (!newWebhookEvent.trim() || !newWebhookUrl.trim() || !user?.uid) return;

    setAddingWebhook(true);
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'x-user-id': user.uid,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ event: newWebhookEvent, url: newWebhookUrl })
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks([...webhooks, {
          id: data.id,
          event: data.event,
          url: data.url,
          active: data.active,
          createdAt: new Date().toISOString()
        }]);
        setNewWebhookEvent("");
        setNewWebhookUrl("");
        setSuccessMessage("Webhook créé avec succès!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error('Error adding webhook:', error);
    } finally {
      setAddingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!user?.uid) return;

    try {
      const response = await fetch('/api/webhooks', {
        method: 'DELETE',
        headers: {
          'x-user-id': user.uid,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ webhookId })
      });

      if (response.ok) {
        setWebhooks(webhooks.filter(w => w.id !== webhookId));
        setSuccessMessage("Webhook supprimé!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  const handleCopyKey = async (text: string, keyId: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">API & Webhooks</h1>
        <p className="text-muted-foreground italic">Gérez vos clés API et configurez les webhooks pour les intégrations.</p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-md bg-green-900/20 border border-green-500/30 text-green-300 flex items-center gap-2">
          <Check className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      <div className="grid gap-6">
        {/* API Keys */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-purple-500" />
                <CardTitle>Clés API</CardTitle>
              </div>
            </div>
            <CardDescription>Gérez vos clés d'accès à l'API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-muted-foreground text-sm">Chargement...</div>
            ) : (
              <>
                {apiKeys.map(key => (
                  <div key={key.id} className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{key.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground font-mono">{key.key}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyKey(key.key, key.id)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedKeyId === key.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-500/10">Active</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteApiKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Add New Key */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nom de la clé (ex: Production)"
                  value={showNewKeyName}
                  onChange={(e) => setShowNewKeyName(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
                <Button
                  onClick={handleAddApiKey}
                  disabled={addingKey || !showNewKeyName.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {addingKey ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Ajouter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Webhooks</CardTitle>
            </div>
            <CardDescription>Configurez les webhooks pour recevoir des événements en temps réel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-muted-foreground text-sm">Chargement...</div>
            ) : (
              <>
                {webhooks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun webhook configuré</p>
                ) : (
                  webhooks.map(webhook => (
                    <div key={webhook.id} className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{webhook.event}</p>
                        <p className="text-xs text-muted-foreground mt-1 break-all">{webhook.url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-500/10">
                          {webhook.active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Add New Webhook */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Événement</label>
                <Input
                  placeholder="site.deployed, site.updated, etc..."
                  value={newWebhookEvent}
                  onChange={(e) => setNewWebhookEvent(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL du webhook</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://yourdomain.com/webhooks/event"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                  <Button
                    onClick={handleAddWebhook}
                    disabled={addingWebhook || !newWebhookEvent.trim() || !newWebhookUrl.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {addingWebhook ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits Info */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Limites d'utilisation</CardTitle>
            <CardDescription>Limites basées sur votre plan actuel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-md border border-white/5 bg-white/2">
                <p className="text-sm font-semibold">Requêtes par minute</p>
                <p className="text-lg font-bold text-blue-400">1000</p>
              </div>
              <div className="p-4 rounded-md border border-white/5 bg-white/2">
                <p className="text-sm font-semibold">Bande passante</p>
                <p className="text-lg font-bold text-green-400">Illimitée</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
