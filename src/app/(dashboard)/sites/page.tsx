
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { addSite, Site, UserProfile } from "@/lib/firestore-service";
import { ExternalLink, Plus, Settings, Globe, Loader2, Terminal, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SitesPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const sitesQuery = useMemo(() => 
    user ? query(collection(firestore, "users", user.uid, "sites"), orderBy("createdAt", "desc")) : null
  , [firestore, user]);

  const { data: profile } = useDoc<UserProfile>(profileRef);
  const { data: sites, loading } = useCollection<Site>(sitesQuery);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const canAddSite = profile?.plan !== 'Starter' || sites.length < 1;

  async function handleAddSite() {
    if (!newSiteName || !newSiteUrl || !user || !canAddSite) return;
    setIsAdding(true);
    try {
      // D'abord déployer sur le VPS
      const token = await user.getIdToken();
      const deployResponse = await fetch("/api/deploy-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteName: newSiteName,
        }),
      });

      if (!deployResponse.ok) {
        const error = await deployResponse.json();
        throw new Error(error.message || "Erreur lors du déploiement");
      }

      // Ensuite ajouter dans Firestore
      await addSite(user.uid, newSiteName, newSiteUrl);
      setNewSiteName("");
      setNewSiteUrl("");
      setIsOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout du site:", error);
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
            <Button className="font-semibold" disabled={!canAddSite && !loading}>
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
            {!canAddSite ? (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Limite atteinte</AlertTitle>
                <AlertDescription>
                  Votre plan Starter est limité à 1 site web. Passez au plan Professional pour des sites illimités.
                </AlertDescription>
                <Button variant="link" className="p-0 h-auto text-xs font-bold uppercase mt-2" asChild>
                  <Link href="/storage">Upgrade Maintenant</Link>
                </Button>
              </Alert>
            ) : (
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
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              {canAddSite && (
                <Button onClick={handleAddSite} disabled={isAdding}>
                  {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Déployer
                </Button>
              )}
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
              <CardFooter className="bg-white/5 border-t border-white/5 p-3 flex flex-wrap gap-2 justify-between">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs hover:bg-white/5 px-2" asChild>
                    <a href={site.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" /> Visiter
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs hover:bg-white/5 px-2" asChild>
                    <Link href={`/sites/${site.id}/logs`}>
                      <Terminal className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Logs
                    </Link>
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-xs hover:bg-white/5 px-2" asChild>
                  <Link href={`/sites/${site.id}/settings`}>
                    <Settings className="mr-2 h-3.5 w-3.5" /> Paramètres
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
