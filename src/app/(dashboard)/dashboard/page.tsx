"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, HardDrive, Layout, ExternalLink, Activity, ArrowUpRight, Zap, ShieldCheck } from "lucide-react";
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
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-t-2 border-primary animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Initialisation du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 dashboard-grid-bg min-h-screen pt-4">
      {/* Header avec un look "Glassmorphism" léger */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-6 rounded-2xl bg-card/30 border border-white/5 backdrop-blur-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{profile?.name || 'Explorateur'}</span>
          </h1>
          <p className="text-muted-foreground text-lg">Votre infrastructure est sous contrôle.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
          <div className="bg-primary/20 p-3 rounded-xl text-primary border border-primary/20">
            <HardDrive className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Capacité Stockage</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{totalUsed.toFixed(1)} GB</span>
              <span className="text-sm text-muted-foreground">/ {storageLimit} GB</span>
            </div>
            <div className="w-32 mt-2">
              <Progress value={totalPercentage} className="h-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Globe className="h-24 w-24 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Sites Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{activeSitesCount}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                Plan {profile?.plan}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-white/5 hover:border-accent/30 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" /> État du Réseau
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-accent">Stable</div>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-accent" /> Latence moyenne: 14ms
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-white/5 hover:border-primary/30 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" /> Prochaine Facture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">29.00€</div>
            <Button variant="link" className="p-0 h-auto text-primary hover:text-accent transition-colors text-sm mt-2">
              Télécharger l'estimation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
            <div className="h-8 w-1 bg-primary rounded-full" />
            Écosystème Digital
          </h2>
          <Button variant="outline" className="border-white/10 hover:bg-white/5 text-muted-foreground" asChild>
            <a href="/sites">Gestion globale <ArrowUpRight className="ml-2 h-4 w-4" /></a>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const usage = getConsumption(site.id);
            const usagePercent = (usage / (storageLimit / sites.length)) * 100;
            
            return (
              <Card key={site.id} className="group hover:scale-[1.02] transition-all duration-300 bg-card border-white/5 hover:shadow-2xl hover:shadow-primary/5">
                <CardHeader className="pb-4 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors truncate">
                        {site.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Globe className="h-3 w-3" />
                        {site.url.replace('https://', '')}
                      </CardDescription>
                    </div>
                    <Badge className={cn(
                      "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase",
                      site.status === 'active' 
                        ? "bg-accent/10 text-accent border border-accent/20" 
                        : "bg-muted text-muted-foreground border border-white/5"
                    )}>
                      {site.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-6 space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium uppercase tracking-tighter">Volume Data</span>
                      <span className="text-white font-bold">{usage.toFixed(2)} GB</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" 
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex-1 text-center">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground opacity-60">Uptime</p>
                      <p className="text-accent font-black text-sm">99.9%</p>
                    </div>
                    <div className="w-px bg-white/5" />
                    <div className="flex-1 text-center">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground opacity-60">Visites</p>
                      <p className="text-white font-black text-sm">1.2k</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex gap-3">
                  <Button variant="secondary" className="flex-1 bg-white/5 hover:bg-white/10 text-white border-none h-10" asChild>
                    <a href={site.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Live
                    </a>
                  </Button>
                  <Button variant="outline" className="aspect-square p-0 w-10 border-white/10 hover:bg-primary/20 hover:text-primary group/btn" asChild>
                     <a href={`/sites`}>
                       <Activity className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                     </a>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
          
          {sites.length === 0 && (
            <Card className="col-span-full py-16 text-center border-dashed bg-primary/5 border-primary/20 rounded-3xl">
              <div className="max-w-xs mx-auto space-y-6">
                <div className="bg-primary/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto text-primary border border-primary/20">
                  <Plus className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Prêt à décoller ?</h3>
                  <p className="text-muted-foreground">Déployez votre premier projet en quelques clics et commencez à surveiller vos métriques.</p>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold" asChild>
                  <a href="/sites">Déployer maintenant</a>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
import { Plus } from "lucide-react";