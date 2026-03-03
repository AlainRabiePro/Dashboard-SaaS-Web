
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, query, doc, addDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Domain, UserProfile, Site } from "@/lib/firestore-service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle, Search, RefreshCw, Loader2, Plus, Trash2, Copy } from "lucide-react";

export default function DomainsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [selectedSite, setSelectedSite] = useState("");

  // Récupérer le profil et les sites de l'utilisateur
  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const sitesRef = useMemo(() => user ? collection(firestore, "users", user.uid, "sites") : null, [firestore, user]);
  const domainsRef = useMemo(() => user ? collection(firestore, "users", user.uid, "domains") : null, [firestore, user]);

  const { data: profile } = useDoc<UserProfile>(profileRef);
  const { data: sites } = useCollection<Site>(sitesRef);
  const { data: domains, loading } = useCollection<Domain>(domainsRef);

  const filteredDomains = domains.filter(d => 
    d.domain.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDomain = async () => {
    if (!newDomain || !selectedSite || !user) return;

    setIsAdding(true);
    try {
      const domainsCollection = collection(firestore, "users", user.uid, "domains");
      
      await addDoc(domainsCollection, {
        domain: newDomain,
        linkedSite: selectedSite,
        dnsStatus: 'propagated' as const,
        expiryDate: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 an
        createdAt: Timestamp.now(),
      });

      toast({
        title: "Domaine ajouté",
        description: `${newDomain} a été lié au site.`,
      });

      setNewDomain("");
      setSelectedSite("");
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!user) return;

    try {
      const domainRef = doc(firestore, "users", user.uid, "domains", domainId);
      await deleteDoc(domainRef);

      toast({
        title: "Domaine supprimé",
        description: "Le domaine a été retiré.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'propagated':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3" /> Propagé</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10"><Clock className="mr-1 h-3 w-3" /> En attente</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border-rose-500/20"><XCircle className="mr-1 h-3 w-3" /> Expiré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Domaines</h1>
          <p className="text-sm text-muted-foreground">Gérez vos domaines personnalisés</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un domaine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un domaine</DialogTitle>
              <DialogDescription>
                Liez un domaine personnalisé à l'un de vos sites
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="domain">Nom du domaine</Label>
                <Input
                  id="domain"
                  placeholder="exemple.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  disabled={isAdding}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="site">Site lié</Label>
                <Select value={selectedSite} onValueChange={setSelectedSite} disabled={isAdding}>
                  <SelectTrigger id="site">
                    <SelectValue placeholder="Sélectionner un site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name || site.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isAdding}>
                Annuler
              </Button>
              <Button onClick={handleAddDomain} disabled={!newDomain || !selectedSite || isAdding}>
                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un domaine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domaine</TableHead>
                <TableHead>Site lié</TableHead>
                <TableHead>Status DNS</TableHead>
                <TableHead>Expiration</TableHead>
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
                filteredDomains.map((domain) => {
                  const linkedSite = sites.find((s) => s.id === domain.linkedSite);
                  const expiryDate = domain.expiryDate?.toDate?.() || new Date();

                  return (
                    <TableRow key={domain.id}>
                      <TableCell className="font-mono text-sm font-medium">{domain.domain}</TableCell>
                      <TableCell>{linkedSite?.name || domain.linkedSite}</TableCell>
                      <TableCell>{getStatusBadge(domain.dnsStatus || "pending")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(expiryDate, "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDomain(domain.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
