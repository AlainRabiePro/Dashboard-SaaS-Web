
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { addSite, Site } from "@/lib/firestore-service";
import { ExternalLink, Plus, Settings, Globe, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";

export default function SitesPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const sitesQuery = useMemo(() => 
    user ? query(collection(firestore, "users", user.uid, "sites"), orderBy("createdAt", "desc")) : null
  , [firestore, user]);

  const { data: sites, loading } = useCollection<Site>(sitesQuery);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  async function handleAddSite() {
    if (!newSiteName || !newSiteUrl || !user) return;
    setIsAdding(true);
    try {
      await addSite(user.uid, newSiteName, newSiteUrl);
      setNewSiteName("");
      setNewSiteUrl("");
      setIsOpen(false);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Projets</h1>
          <p className="text-muted-foreground">Gérez et surveillez vos applications déployées.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Nouveau Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-white/10">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau site</DialogTitle>
              <DialogDescription>
                Déployez une nouvelle application sur SaasFlow.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Nom du site</label>
                <Input 
                  placeholder="e.g. My Awesome App" 
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="bg-zinc-900 border-white/5"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">URL de Production</label>
                <Input 
                  placeholder="https://example.com" 
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  className="bg-zinc-900 border-white/5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button onClick={handleAddSite} disabled={isAdding}>
                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Déployer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id} className="overflow-hidden border-white/5 bg-zinc-950/50 backdrop-blur-sm group hover:border-primary/50 transition-all">
              <CardHeader className="bg-white/5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={site.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {site.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    {site.createdAt ? format(site.createdAt.toDate(), "MMM dd, yyyy") : "..."}
                  </p>
                </div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {site.name}
                </CardTitle>
                <CardDescription className="truncate text-xs opacity-60">{site.url}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Framework</p>
                    <p className="text-xs font-semibold">{site.framework || "Next.js"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Région</p>
                    <p className="text-xs font-semibold">{site.region || "us-east-1"}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-white/5 border-t border-white/5 p-3 flex justify-between">
                <Button variant="ghost" size="sm" className="text-xs hover:bg-white/5" asChild>
                  <a href={site.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Visiter
                  </a>
                </Button>
                <Button variant="ghost" size="sm" className="text-xs hover:bg-white/5" asChild>
                  <Link href={`/sites/${site.id}/settings`}>
                    <Settings className="mr-2 h-4 w-4" /> Paramètres
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
          {sites.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl border-white/5 bg-zinc-950/20">
              <p className="text-muted-foreground">Aucun projet trouvé. Déployez votre premier site !</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
