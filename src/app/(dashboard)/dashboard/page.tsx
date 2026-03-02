
"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, HardDrive, Layout, ExternalLink, Activity, ArrowUpRight } from "lucide-react";
import { UserProfile, Site } from "@/lib/firestore-service";

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const sitesRef = useMemo(() => user ? collection(firestore, "users", user.uid, "sites") : null, [firestore, user]);
  
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(profileRef);
  const { data: sites, loading: sitesLoading } = useCollection<Site>(sitesRef);

  // Stats calculées
  const activeSitesCount = sites.filter(s => s.status === 'active').length;
  const storageLimit = profile?.storageLimit || 10;
  
  // Fonction pour simuler une consommation par site pour la démo
  const getConsumption = (siteId: string) => {
    // On génère un nombre pseudo-aléatoire mais stable basé sur l'ID
    const hash = siteId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 4) + 0.5; // Entre 0.5 et 4.5 GB
  };

  const totalUsed = sites.reduce((acc, site) => acc + getConsumption(site.id), 0);
  const totalPercentage = (totalUsed / storageLimit) * 100;

  if (profileLoading || sitesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Chargement de vos sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-muted-foreground">Bienvenue, voici l'état actuel de vos projets et de votre consommation.</p>
        </div>
        <div className="flex items-center gap-3 bg-card p-3 rounded-lg border shadow-sm">
          <div className="bg-primary/10 p-2 rounded-full text-primary">
            <HardDrive className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Stockage Global</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{totalUsed.toFixed(1)} GB</span>
              <span className="text-xs text-muted-foreground">/ {storageLimit} GB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites Actifs</CardTitle>
            <Globe className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeSitesCount}</div>
            <p className="text-xs opacity-70 mt-1">Sur {sites.length} sites configurés</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Santé Système</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">100%</div>
            <p className="text-xs text-muted-foreground mt-1">Tous les services sont opérationnels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturation</CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase">Plan {profile?.plan}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">29.00€</div>
            <p className="text-xs text-muted-foreground mt-1 text-primary cursor-pointer hover:underline">Voir la prochaine facture</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            Mes Sites & Consommation
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <a href="/sites">Tout gérer <ArrowUpRight className="ml-1 h-4 w-4" /></a>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const usage = getConsumption(site.id);
            const usagePercent = (usage / (storageLimit / sites.length)) * 100; // Par rapport à une moyenne théorique
            
            return (
              <Card key={site.id} className="group hover:shadow-md transition-all border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-bold truncate pr-4">{site.name}</CardTitle>
                    <Badge variant={site.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {site.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs truncate flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {site.url.replace('https://', '')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-medium">Consommation Stockage</span>
                      <span className="font-bold">{usage.toFixed(2)} GB</span>
                    </div>
                    <Progress value={Math.min(usagePercent, 100)} className="h-1.5" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground bg-muted/30 p-2 rounded">
                    <div>
                      <p className="uppercase font-semibold opacity-60">Visiteurs/mois</p>
                      <p className="text-foreground font-medium">12.4k</p>
                    </div>
                    <div>
                      <p className="uppercase font-semibold opacity-60">Uptime</p>
                      <p className="text-green-600 font-medium">99.98%</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                    <a href={site.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" /> Visiter
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" className="px-2 h-8" asChild>
                     <a href={`/sites`} title="Configuration">
                       <Activity className="h-4 w-4" />
                     </a>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
          
          {sites.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-muted bg-muted/10">
              <p className="text-muted-foreground mb-4">Vous n'avez pas encore de site déployé.</p>
              <Button asChild>
                <a href="/sites">Ajouter mon premier site</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
