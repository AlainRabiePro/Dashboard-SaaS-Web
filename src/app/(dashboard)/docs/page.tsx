"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DocsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground italic">Apprenez à utiliser SaasFlow avec nos guides complets.</p>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher la documentation..." 
            className="pl-10 bg-zinc-900 border-white/10"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm group cursor-pointer hover:border-white/10">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <CardTitle>Getting Started</CardTitle>
            </div>
            <CardDescription>Démarrez avec les bases</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Créer votre premier site</li>
              <li>✓ Configurer un domaine</li>
              <li>✓ Déployer votre application</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm group cursor-pointer hover:border-white/10">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              <CardTitle>API Reference</CardTitle>
            </div>
            <CardDescription>Documentation API complète</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Endpoints REST</li>
              <li>✓ Webhooks</li>
              <li>✓ Authentification</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm group cursor-pointer hover:border-white/10">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              <CardTitle>Guides avancés</CardTitle>
            </div>
            <CardDescription>Optimisez votre utilisation</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Scaling et performance</li>
              <li>✓ Sécurité et backups</li>
              <li>✓ CI/CD integration</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm group cursor-pointer hover:border-white/10">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <CardTitle>Troubleshooting</CardTitle>
            </div>
            <CardDescription>Résoudre les problèmes courants</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Erreurs de déploiement</li>
              <li>✓ Problèmes de domaine</li>
              <li>✓ Questions de performance</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Ressources supplémentaires</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button variant="outline" className="justify-start">
            <Bookmark className="h-4 w-4 mr-2" />
            Interactives Tutorials
          </Button>
          <Button variant="outline" className="justify-start">
            <Bookmark className="h-4 w-4 mr-2" />
            Community Forum
          </Button>
          <Button variant="outline" className="justify-start">
            <Bookmark className="h-4 w-4 mr-2" />
            Status Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
