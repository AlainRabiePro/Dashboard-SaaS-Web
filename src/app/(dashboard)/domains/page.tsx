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
import { useDomainSearch } from "@/hooks/use-domain-search";
import { CheckCircle2, Clock, XCircle, Search, Loader2, Plus, Trash2, ShoppingCart } from "lucide-react";

interface Domain {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  ssl: boolean;
  pointsTo: string | null;
}

export default function DomainsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { searchDomainVariations, orderDomain, fetchOrders, searchLoading, searchResults, orders } = useDomainSearch();
  
  const [search, setSearch] = useState("");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search & Buy states
  const [searchInput, setSearchInput] = useState("");
  const [orderingDomain, setOrderingDomain] = useState<string | null>(null);

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
      fetchOrders();
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
      {/* Section Achat de Domaines */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
            Trouver & Acheter un Domaine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="search-domain">Mot-clé (ex: google, amazon...)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="search-domain"
                  placeholder="Entrez un mot-clé"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchDomainVariations(searchInput)}
                  className="bg-white/5 border-white/10"
                />
                <Button
                  onClick={() => searchDomainVariations(searchInput)}
                  disabled={searchLoading || !searchInput.trim()}
                  className="gap-2"
                >
                  {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Rechercher
                </Button>
              </div>
            </div>

            {/* Résultats de recherche en grille */}
            {searchResults.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3 text-muted-foreground">
                  {searchResults.filter(r => r.available).length} domaine(s) disponible(s) sur {searchResults.length}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {searchResults.map((result) => (
                    <div
                      key={result.domain}
                      className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-white/30 ${
                        result.available
                          ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                          : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10 opacity-60'
                      }`}
                    >
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium text-sm truncate">{result.domain}</p>
                          <p className={`text-xs ${result.available ? 'text-green-400' : 'text-red-400'}`}>
                            {result.available ? '✅ Libre' : '❌ Pris'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-white/10">
                          <span className="text-xs font-medium">{result.price}€</span>
                          {result.available && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setOrderingDomain(result.domain);
                                orderDomain(result.domain, result.price);
                              }}
                              disabled={searchLoading || orderingDomain === result.domain}
                              className="h-6 px-2 text-xs"
                            >
                              {orderingDomain === result.domain ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mes Commandes */}
            {orders.length > 0 && (
              <div className="border-t pt-4">
                <p className="font-medium mb-3">Mes Commandes</p>
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div>
                        <p className="font-medium text-sm">{order.domain}</p>
                        <p className="text-xs text-muted-foreground">{order.price}€</p>
                      </div>
                      <Badge className={
                        order.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }>
                        {order.status === 'paid' ? '✅ Payé' : 
                         order.status === 'pending' ? '⏳ Paiement' : 
                         '❌ Expiré'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Domaines personnalisés existants */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Domaines Personnalisés</h1>
          <p className="text-sm text-muted-foreground">Gérez vos domaines liés à vos projets</p>
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
