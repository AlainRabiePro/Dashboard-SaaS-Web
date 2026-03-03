"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, Lock, RefreshCw } from "lucide-react";

export default function ApiPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">API & Webhooks</h1>
        <p className="text-muted-foreground italic">Gérez vos clés API et configurez les webhooks pour les intégrations.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-purple-500" />
                <CardTitle>API Rest Endpoint</CardTitle>
              </div>
              <Badge>Active</Badge>
            </div>
            <CardDescription>Votre point de terminaison API public</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-zinc-900 rounded-md p-4 font-mono text-sm">
              <div className="text-muted-foreground">https://api.saasflow.io/v1</div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Documentation</p>
              <Button variant="outline" size="sm">
                Voir la documentation OpenAPI
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Webhooks configurés</CardTitle>
              <Button variant="outline" size="sm">+ Ajouter webhook</Button>
            </div>
            <CardDescription>Recevez des événements en temps réel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
                <div>
                  <p className="font-semibold text-sm">site.deployed</p>
                  <p className="text-xs text-muted-foreground">https://yourdomain.com/webhooks/deploy</p>
                </div>
                <Badge variant="outline" className="bg-green-500/10">Actif</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
                <div>
                  <p className="font-semibold text-sm">site.updated</p>
                  <p className="text-xs text-muted-foreground">https://yourdomain.com/webhooks/update</p>
                </div>
                <Badge variant="outline" className="bg-green-500/10">Actif</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
            <CardDescription>Limites d'utilisation de votre plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-md border border-white/5 bg-white/2">
                <p className="text-sm font-semibold">Requêtes par minute</p>
                <p className="text-lg font-bold text-blue-400">1000</p>
              </div>
              <div className="p-4 rounded-md border border-white/5 bg-white/2">
                <p className="text-sm font-semibold">Bande passante</p>
                <p className="text-lg font-bold text-green-400">Illimitée</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
