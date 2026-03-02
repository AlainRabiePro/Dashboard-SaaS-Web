
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Domain } from "@/lib/firestore-service";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle, Search, RefreshCw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DomainsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const domainsQuery = useMemo(() => 
    user ? query(collection(firestore, "users", user.uid, "domains")) : null
  , [firestore, user]);

  const { data: domains, loading } = useCollection<Domain>(domainsQuery);
  const [search, setSearch] = useState("");

  const filteredDomains = domains.filter(d => 
    d.domain.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Noms de Domaine</h1>
        <p className="text-muted-foreground">Gérez vos domaines personnalisés et vos configurations DNS.</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un domaine..." 
            className="pl-9 bg-zinc-900 border-white/5 h-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-white/5 hover:bg-white/5 h-10">
          <RefreshCw className="mr-2 h-4 w-4" /> Rafraîchir DNS
        </Button>
      </div>

      <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Domaine</TableHead>
                <TableHead className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Site lié</TableHead>
                <TableHead className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Status DNS</TableHead>
                <TableHead className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Expiration</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-widest font-bold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">Chargement des domaines...</p>
                      </div>
                   </TableCell>
                 </TableRow>
              ) : (
                filteredDomains.map((domain) => (
                  <TableRow key={domain.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-semibold text-sm">{domain.domain}</TableCell>
                    <TableCell className="text-xs">{domain.linkedSite}</TableCell>
                    <TableCell>{getStatusBadge(domain.dnsStatus)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {domain.expiryDate ? format(domain.expiryDate.toDate(), "MMM dd, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-xs hover:bg-white/10">DNS Config</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && filteredDomains.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <p className="text-sm text-muted-foreground">Aucun domaine trouvé.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
