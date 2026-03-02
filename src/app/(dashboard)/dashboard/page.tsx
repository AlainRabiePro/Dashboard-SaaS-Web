"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  HardDrive, 
  Activity, 
  ArrowUpRight, 
  Zap, 
  ShieldCheck, 
  ExternalLink,
  Plus,
  BarChart3
} from "lucide-react";
import { UserProfile, Site } from "@/lib/firestore-service";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const sitesRef = useMemo(() => user ? collection(firestore, "users", user.uid, "sites") : null, [firestore, user]);
  
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(profileRef);
  const { data: sites, loading: sitesLoading } = useCollection<Site>(sitesRef);

  const activeSitesCount = sites.filter(s => s.status === 'active').length;
  const storageLimit = profile?.storageLimit || 10;
  
  const getConsumption = (siteId: string) => {
    const hash = siteId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 4) + 0.5;
  };

  const totalUsed = sites.reduce((acc, site) => acc + getConsumption(site.id), 0);
  const totalPercentage = (totalUsed / storageLimit) * 100;

  if (profileLoading || sitesLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground font-medium">Chargement des ressources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h1>
          <p className="text-muted-foreground">Gérez vos infrastructures et surveillez vos déploiements en temps réel.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" /> Rapports
          </Button>
          <Button size="sm" asChild>
            <a href="/sites"><Plus className="mr-2 h-4 w-4" /> Nouveau Projet</a>
          </Button>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites Actifs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSitesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Sur {sites.length} projets au total</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stockage Utilisé</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsed.toFixed(1)} GB</div>
            <Progress value={totalPercentage} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">État Réseau</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Opérationnel</div>
            <p className="text-xs text-muted-foreground mt-1">99.9% de disponibilité</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière Facture</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">29,00 €</div>
            <p className="text-xs text-muted-foreground mt-1">Plan {profile?.plan}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Projets récents</h2>
          <div className="grid gap-4">
            {sites.slice(0, 4).map((site) => (
              <Card key={site.id} className="shadow-none border-border/60 hover:border-border transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-foreground/70" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{site.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{site.url.replace('https://', '')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider h-5 px-1.5 border-border/50">
                        {site.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                        <a href={site.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {sites.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">Aucun projet pour le moment.</p>
                <Button variant="link" size="sm" asChild>
                  <a href="/sites">Déployer votre premier site</a>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Consommation par ressource</h2>
          <Card className="shadow-none border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Utilisation du Stockage</CardTitle>
              <CardDescription>Répartition de vos données par projet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sites.map((site) => {
                const usage = getConsumption(site.id);
                const percent = (usage / (storageLimit / sites.length)) * 100;
                return (
                  <div key={site.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{site.name}</span>
                      <span className="text-muted-foreground">{usage.toFixed(2)} GB</span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>
                );
              })}
              {sites.length > 0 && (
                <div className="pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>Total utilisé</span>
                    <span>{totalUsed.toFixed(1)} / {storageLimit} GB</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full text-xs h-8" asChild>
                <a href="/storage">Voir les détails techniques</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}