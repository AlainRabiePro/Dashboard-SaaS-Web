
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getUserProfile, getSites, UserProfile, Site } from "@/lib/firestore-service";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { HardDrive, AlertTriangle, TrendingUp, Check, X } from "lucide-react";
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
    name: "STARTER",
    price: "4.99",
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
    name: "PROFESSIONAL",
    price: "9.99",
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
    name: "ENTERPRISE",
    price: "16.99",
    features: [
      { text: "Stockage Illimité", included: true },
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(setProfile);
      getSites(user.uid).then(setSites);
    }
  }, [user]);

  const usedStorage = 4.2; 
  const totalStorage = profile?.storageLimit || 10;
  const usagePercentage = (usedStorage / totalStorage) * 100;

  const chartData = [
    { name: 'Portfolio', value: 2.1 },
    { name: 'Personal Blog', value: 1.5 },
    { name: 'Internal Wiki', value: 0.6 },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--foreground)/0.5)', 'hsl(var(--muted-foreground))'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Utilisation du Stockage</h1>
        <p className="text-muted-foreground">Surveillez et faites évoluer vos ressources de stockage.</p>
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
                <span className="text-4xl font-bold">{usedStorage} GB</span>
                <span className="text-muted-foreground text-sm">sur {totalStorage} GB</span>
              </div>
              <Progress value={usagePercentage} className="h-2 bg-zinc-800" />
              <p className="text-xs text-muted-foreground">Vous utilisez {usagePercentage.toFixed(1)}% de votre quota actuel.</p>
            </div>

            <div className="p-5 rounded-xl bg-zinc-900/50 border border-white/5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Besoin de plus d'espace ?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Passez à un forfait supérieur pour obtenir jusqu'à 100 Go de stockage haute performance.</p>
                </div>
              </div>
              
              <Dialog>
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
                      {pricingPlans.map((plan) => (
                        <div 
                          key={plan.name} 
                          className={`relative flex flex-col p-8 rounded-[2rem] border border-white/10 bg-zinc-900/30 transition-all hover:bg-zinc-900/50`}
                        >
                          {plan.isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-zinc-800 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full text-zinc-300">
                              RECOMMANDÉ
                            </div>
                          )}
                          <div className="text-center mb-8">
                            <h3 className="text-xs font-bold tracking-[0.2em] text-zinc-500 mb-4">{plan.name}</h3>
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
                          >
                            CHOISIR CE PLAN
                          </Button>
                        </div>
                      ))}
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
            <CardDescription>Usage individuel par application (GB).</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                  contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
