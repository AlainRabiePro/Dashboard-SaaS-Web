
"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, updateDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserProfile, Site, updateUserPlan } from "@/lib/firestore-service";
import { formatStorage } from "@/lib/format-storage";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { HardDrive, AlertTriangle, TrendingUp, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const pricingPlans = [
  {
    name: "Starter" as const,
    price: "4.99",
    limit: 5,
    features: [
      { text: "5GB Stockage", included: true },
      { text: "1 Site Web", included: true },
      { text: "Déploiement Automatique", included: false },
      { text: "Intégration AdSense", included: false },
      { text: "Provisioning Avancé", included: false },
    ],
    buttonVariant: "default" as const,
    isPopular: false
  },
  {
    name: "Professional" as const,
    price: "9.99",
    limit: 15,
    features: [
      { text: "15GB Stockage", included: true },
      { text: "Sites Illimités", included: true },
      { text: "Déploiement Automatique", included: true },
      { text: "Intégration AdSense", included: true },
      { text: "Provisioning Avancé", included: false },
    ],
    buttonVariant: "secondary" as const,
    isPopular: true
  },
  {
    name: "Enterprise" as const,
    price: "16.99",
    limit: 100,
    features: [
      { text: "100GB Stockage", included: true },
      { text: "Sites Illimités", included: true },
      { text: "Déploiement Automatique", included: true },
      { text: "Intégration AdSense", included: true },
      { text: "Provisioning Avancé", included: true },
    ],
    buttonVariant: "default" as const,
    isPopular: false
  }
];

export default function StoragePage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalculatingStorage, setIsCalculatingStorage] = useState(false);

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const sitesRef = useMemo(() => user ? collection(firestore, "users", user.uid, "sites") : null, [firestore, user]);

  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(profileRef);
  const { data: sites, loading: sitesLoading } = useCollection<Site>(sitesRef);

  // Récupérer le stockage réel de l'API et mettre à jour Firestore
  useEffect(() => {
    if (!user || !firestore || sites.length === 0 || !profile) return;

    const fetchRealStorage = async () => {
      try {
        setIsCalculatingStorage(true);
        const token = await user.getIdToken();

        // Préparer les données à envoyer
        const siteNames = sites.map(s => s.name);

        const response = await fetch("/api/calculate-storage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            siteNames: siteNames,
            plan: profile.plan || 'basic',
          }),
        });

        if (!response.ok) {
          console.warn("Erreur lors du calcul du stockage");
          setIsCalculatingStorage(false);
          return;
        }

        const data = await response.json();
        const storageData = data.storage || {};

        // Mettre à jour Firestore pour chaque site
        for (const site of sites) {
          const domainKey = site.name.toLowerCase().replace(/\./g, "-");
          const realStorageGB = storageData[domainKey] || 0;

          if (realStorageGB !== site.storageUsed) {
            const siteRef = doc(firestore, "users", user.uid, "sites", site.id);
            await updateDoc(siteRef, {
              storageUsed: realStorageGB,
              lastStorageCheck: new Date(),
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du stockage:", error);
      } finally {
        setIsCalculatingStorage(false);
      }
    };

    fetchRealStorage();
  }, [user, firestore, sites, profile]);

  const totalUsed = sites.reduce((acc, site) => acc + (site.storageUsed || 0), 0);
  const totalLimit = profile?.storageLimit || 0;
  const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  const showStorageWarning = usagePercentage >= 80 && profile?.plan !== 'Enterprise';

  const chartData = sites.map(site => ({
    name: site.name,
    value: site.storageUsed || 0
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['hsl(var(--primary))', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'];

  async function handleSelectPlan(planName: UserProfile['plan'], limit: number) {
    if (!user) return;
    setIsUpdating(planName);
    try {
      updateUserPlan(user.uid, planName, limit);
      toast({
        title: "Plan mis à jour",
        description: `Vous êtes maintenant sur le plan ${planName}.`,
      });
      setIsDialogOpen(false);
    } catch (e) {
      // Les erreurs sont gérées par l'ErrorEmitter global
    } finally {
      setIsUpdating(null);
    }
  }

  if (profileLoading || sitesLoading) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Utilisation du Stockage</h1>
        <p className="text-muted-foreground">Surveillez et faites évoluer vos ressources de stockage en temps réel.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="h-5 w-5 text-primary" />
              Vue d'ensemble globale
            </CardTitle>
            <CardDescription>Consommation agrégée sur tous vos projets.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold">{formatStorage(totalUsed)}</span>
                <span className="text-muted-foreground text-sm">sur {totalLimit} GB</span>
              </div>
              <Progress value={usagePercentage} className="h-2 bg-zinc-900" />
              <p className="text-xs text-muted-foreground">Vous utilisez {usagePercentage.toFixed(1)}% de votre quota actuel ({profile?.plan}).</p>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900/50 border border-white/5 space-y-4">
              {showStorageWarning && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Besoin de plus d'espace ?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Passez à un forfait supérieur pour obtenir jusqu'à 100 Go de stockage haute performance.</p>
                  </div>
                </div>
              )}
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full font-bold shadow-lg shadow-primary/20">Upgrade Storage</Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl bg-zinc-950 border-white/10 p-0 overflow-hidden">
                  <div className="p-8 md:p-12 space-y-12">
                    <DialogHeader className="hidden">
                      <DialogTitle>Plans de stockage</DialogTitle>
                      <DialogDescription>Choisissez votre plan</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {pricingPlans.map((plan) => {
                        const isCurrent = profile?.plan === plan.name;
                        return (
                          <div 
                            key={plan.name} 
                            className={`relative flex flex-col p-8 rounded-[2rem] border border-white/10 bg-zinc-900/30 transition-all hover:bg-zinc-900/50 ${isCurrent ? 'ring-2 ring-primary ring-offset-4 ring-offset-zinc-950' : ''}`}
                          >
                            {plan.isPopular && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-zinc-800 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full text-zinc-300">
                                RECOMMANDÉ
                              </div>
                            )}
                            <div className="text-center mb-8">
                              <h3 className="text-xs font-bold tracking-[0.2em] text-zinc-500 mb-4 uppercase">{plan.name}</h3>
                              <div className="flex items-baseline justify-center gap-1">
                                <span className="text-5xl font-bold text-white">${plan.price}</span>
                                <span className="text-zinc-500 text-sm">/ mois</span>
                              </div>
                            </div>

                            <div className="flex-1 space-y-4 mb-10 pt-4">
                              {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-4 text-sm">
                                  {feature.included ? (
                                    <Check className="h-4 w-4 text-zinc-400 shrink-0" />
                                  ) : (
                                    <X className="h-4 w-4 text-zinc-700 shrink-0" />
                                  )}
                                  <span className={feature.included ? "text-zinc-300" : "text-zinc-600 line-through decoration-zinc-700"}>
                                    {feature.text}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <Button 
                              variant={plan.buttonVariant} 
                              className="w-full h-12 font-bold uppercase text-[11px] tracking-[0.15em] rounded-xl"
                              onClick={() => handleSelectPlan(plan.name, plan.limit)}
                              disabled={isCurrent || (isUpdating === plan.name)}
                            >
                              {isUpdating === plan.name ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrent ? "PLAN ACTUEL" : "CHOISIR CE PLAN"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-accent" />
              Répartition par Projet
            </CardTitle>
            <CardDescription>Usage individuel extrait de vos applications réelles.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {sites.length > 0 ? (
              <div className="space-y-6">
                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={Math.max(200, sites.length * 40)}>
                      <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '10px', fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                          contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}
                          formatter={(value) => [formatStorage(value as number), 'Utilisation']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Tableau détaillé */}
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <h4 className="text-sm font-semibold mb-3">Détail par projet</h4>
                      <div className="space-y-2">
                        {chartData.map((site) => (
                          <div key={site.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-sm">{site.name}</span>
                            <span className="text-sm font-semibold text-primary">{formatStorage(site.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {isCalculatingStorage ? "Calcul du stockage en cours..." : "Vos projets n'utilisent pas encore d'espace de stockage."}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Aucun projet trouvé. Créez un projet pour voir l'utilisation.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
