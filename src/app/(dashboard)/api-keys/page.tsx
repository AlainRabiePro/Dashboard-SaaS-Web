"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Loader2, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newKey, setNewKey] = useState<{ id: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchApiKeys = async () => {
    if (!user?.uid) return;
    try {
      const response = await fetch('/api/api-keys', {
        headers: { 'x-user-id': user.uid }
      });
      const data = await response.json();
      setApiKeys(data.keys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchApiKeys();
    }
  }, [user?.uid]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !keyName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'x-user-id': user.uid,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: keyName }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewKey({ id: data.id, key: data.key });
        setKeyName('');
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 1) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    if (months > 0) return `Il y a ${months} mois`;
    return `Il y a ${days} jours`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Clés API</h1>
        <p className="text-muted-foreground italic">Générez et gérez vos clés d'accès API sécurisées.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-500" />
                <CardTitle>Clés actives</CardTitle>
              </div>
              <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Nouvelle clé</Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-white/5">
                  {newKey ? (
                    <>
                      <DialogHeader>
                        <DialogTitle>Clé créée avec succès</DialogTitle>
                        <DialogDescription>Copiez votre clé maintenant. Vous ne pourrez pas la voir à nouveau.</DialogDescription>
                      </DialogHeader>
                      <Alert className="bg-amber-500/10 border-amber-500/20">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                        <AlertDescription className="text-amber-400 ml-2">
                          Gardez cette clé en sécurité. Ne la partagez jamais.
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-3">
                        <div className="bg-zinc-900 rounded p-3 font-mono text-sm break-all border border-white/10">
                          {newKey.key}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => copyToClipboard(newKey.key)}
                          >
                            {copied ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Copié!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copier
                              </>
                            )}
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={() => {
                              setNewKey(null);
                              setIsOpenDialog(false);
                            }}
                          >
                            Fermer
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <DialogHeader>
                        <DialogTitle>Créer une nouvelle clé API</DialogTitle>
                        <DialogDescription>Donnez un nom à votre nouvelle clé API.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateKey} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="keyName">Nom de la clé</Label>
                          <Input
                            id="keyName"
                            placeholder="Ma clé API"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            required
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsOpenDialog(false)}>Annuler</Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Créer
                          </Button>
                        </DialogFooter>
                      </form>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>Gérez l'accès à votre API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucune clé API créée</div>
            ) : (
              apiKeys.map((key) => (
                <div key={key.id} className="p-4 rounded-md border border-white/5 bg-white/2">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">{key.name}</p>
                      <p className="text-xs text-muted-foreground">Créée {formatDate(key.createdAt)}</p>
                    </div>
                    <Badge className={key.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {key.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-900 rounded p-2 font-mono text-xs">
                      {showKey ? key.key : key.key.slice(0, 10) + '•'.repeat(20)}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setShowKey(!showKey)}>
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(key.key)}><Copy className="h-4 w-4" /></Button>
                    {key.status === 'active' && <Button size="sm" variant="ghost"><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
            <CardDescription>Bonnes pratiques pour vos clés API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
              <p className="font-semibold text-blue-400">✓ Ne partagez jamais votre clé secrète</p>
            </div>
            <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
              <p className="font-semibold text-blue-400">✓ Utilisez des variables d'environnement</p>
            </div>
            <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
              <p className="font-semibold text-blue-400">✓ Régénérez les clés compromises</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
