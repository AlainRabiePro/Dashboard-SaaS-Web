
"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  HardDrive, 
  Activity, 
  ShieldCheck, 
  ExternalLink,
  Plus,
  BarChart3,
  Zap
} from "lucide-react";
import { UserProfile, Site, Invoice } from "@/lib/firestore-service";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const sitesRef = useMemo(() => user ? collection(firestore, "users", user.uid, "sites") : null, [firestore, user]);
  const latestInvoiceQuery = useMemo(() => user ? query(collection(firestore, "users", user.uid, "invoices"), orderBy("date", "desc"), limit(1)) : null, [firestore, user]);
  
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(profileRef);
  const { data: sites, loading: sitesLoading } = useCollection<Site>(sitesRef);
  const { data: invoices, loading: invoicesLoading } = useCollection<Invoice>(latestInvoiceQuery);

  const activeSitesCount = sites.filter(s => s.status === 'active').length;
  const storageLimit = profile?.storageLimit || 0;
  const totalUsed = sites.reduce((acc, site) => acc + (site.storageUsed || 0), 0);
  const totalPercentage = storageLimit > 0 ? (totalUsed / storageLimit) * 100 : 0;
  
  const lastInvoiceAmount = invoices.length > 0 ? invoices[0].amount : 0;

  if (profileLoading || sitesLoading || invoicesLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground font-medium">Synchronisation en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h1>
          <p className="text-muted-foreground">Gérez vos infrastructures et surveillez vos déploiements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" /> Rapports
          </Button>
          <Button size="sm" asChild>
            <Link href="/sites"><Plus className="mr-2 h-4 w-4" /> Nouveau Projet</Link>
          </Button>
        </div>
      </div>

      <Separator className="bg-white/5" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-950/50 border-white/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites Actifs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSitesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Plan {profile?.plan}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950/50 border-white/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stockage Utilisé</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsed.toFixed(1)} GB</div>
            <Progress value={totalPercentage} className="h-1.5 mt-2 bg-zinc-800" />
          </CardContent>
        </Card>
        <Card className="bg-zinc-950/50 border-white/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">État Réseau</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Opérationnel</div>
            <p className="text-xs text-muted-foreground mt-1">Disponibilité 99.9%</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950/50 border-white/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière Facture</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastInvoiceAmount.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground mt-1">Auto-renouvellement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Projets récents</h2>
          <div className="grid gap-4">
            {sites.slice(0, 4).map((site) => (
              <Card key={site.id} className="bg-zinc-950/30 border-white/5 hover:border-white/10 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-md bg-zinc-900 flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{site.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{site.url.replace('https://', '')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider h-5 px-1.5 border-white/10">
                        {site.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                        <a href={site.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      <span>Consommation</span>
                      <span>{site.storageUsed?.toFixed(2)} GB</span>
                    </div>
                    <Progress value={(site.storageUsed / (storageLimit / Math.max(1, sites.length))) * 100} className="h-1 bg-zinc-900" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Analyse de stockage</h2>
          <Card className="bg-zinc-950/50 border-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quota Global ({profile?.plan})</CardTitle>
              <CardDescription>Consommation par rapport à votre limite de plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="relative h-32 w-32 flex items-center justify-center">
                    <svg className="h-full w-full -rotate-90 transform">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-zinc-900"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 * (1 - totalPercentage / 100)}
                        className="text-primary transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-bold">{totalPercentage.toFixed(0)}%</span>
                      <span className="text-[10px] uppercase text-muted-foreground">Utilisé</span>
                    </div>
                  </div>
                  <div className="mt-6 space-y-1">
                    <p className="text-sm font-medium">{totalUsed.toFixed(2)} GB consommés</p>
                    <p className="text-xs text-muted-foreground">Limite de plan : {storageLimit} GB</p>
                  </div>
               </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full text-xs h-8 border-white/5 hover:bg-white/5" asChild>
                <Link href="/storage">Détails techniques</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
