"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, XCircle, Search, Loader2, Plus, Trash2 } from "lucide-react";

interface Domain {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  ssl: boolean;
  pointsTo: string | null;
}

export default function DomainsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDomains = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const response = await fetch('/api/domains', {
        headers: { 'x-user-id': user.uid }
      });
      const data = await response.json();
      setDomains(data.domains || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les domaines",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchDomains();
    }
  }, [user?.uid]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !newDomain.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'x-user-id': user.uid,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newDomain }),
      });

      if (response.ok) {
        toast({
          title: "Domaine ajouté",
          description: `${newDomain} a été ajouté à vos domaines.`,
        });
        setNewDomain("");
        setIsOpenDialog(false);
        await fetchDomains();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible d'ajouter le domaine",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!user?.uid) return;
    // TODO: Implement delete endpoint
    toast({
      title: "À venir",
      description: "La suppression de domaine sera disponible bientôt",
    });
  };

  const filteredDomains = domains.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" /> Vérifié</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="mr-1 h-3 w-3" /> En attente</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="mr-1 h-3 w-3" /> Expiré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Domaines</h1>
          <p className="text-sm text-muted-foreground">Gérez vos domaines personnalisés</p>
        </div>

        <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un domaine
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-white/5">
            <DialogHeader>
              <DialogTitle>Ajouter un domaine</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau domaine à votre compte
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddDomain} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Nom du domaine</Label>
                <Input
                  id="domain"
                  placeholder="exemple.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpenDialog(false)} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!newDomain.trim() || isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Ajouter
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un domaine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domaine</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>SSL</TableHead>
                <TableHead>Points vers</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDomains.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Aucun domaine trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-mono text-sm font-medium">{domain.name}</TableCell>
                    <TableCell>{getStatusBadge(domain.status)}</TableCell>
                    <TableCell>
                      <Badge className={domain.ssl ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {domain.ssl ? 'Activé' : 'Désactivé'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {domain.pointsTo || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
