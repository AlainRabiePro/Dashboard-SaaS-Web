"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Zap, Bug, Sparkles } from "lucide-react";

export default function ChangelogPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
        <p className="text-muted-foreground italic">Suivez toutes les mises à jour et améliorations de SaasFlow.</p>
      </div>

      <div className="space-y-6">
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-400">v3.2.0</Badge>
                <CardTitle className="text-lg">Performance améliorations</CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">3 mars 2026</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-green-500 shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Optimisation du cache</p>
                <p className="text-xs text-muted-foreground">Réduction de 40% de la latence</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-green-500 shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Nouveau dashboard analytics</p>
                <p className="text-xs text-muted-foreground">Visualisations en temps réel</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Bug className="h-5 w-5 text-amber-500 shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Correction de bugs critiques</p>
                <p className="text-xs text-muted-foreground">Plus de 10 problèmes réglés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/20 text-purple-400">v3.1.5</Badge>
                <CardTitle className="text-lg">Nouvelles intégrations API</CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">1 mars 2026</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-green-500 shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Support Stripe</p>
                <p className="text-xs text-muted-foreground">Intégration de paiement</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-green-500 shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Webhooks GitHub</p>
                <p className="text-xs text-muted-foreground">Déploiement automatique</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-400">v3.1.0</Badge>
                <CardTitle className="text-lg">Lancement public</CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">28 février 2026</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-green-500 shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-sm">Version stable publicly disponible</p>
                <p className="text-xs text-muted-foreground">Prêt pour la production</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-500/20 text-gray-400">v3.0.0</Badge>
                <CardTitle className="text-lg">Première version beta</CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">15 février 2026</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Lancement initial de la plateforme SaasFlow</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
