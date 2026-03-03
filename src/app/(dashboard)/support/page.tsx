"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Mail, MessageSquare, Phone, Clock } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="text-muted-foreground italic">Nous sommes là pour vous aider. Contactez notre équipe.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Email</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold">Support standard</p>
              <p className="text-xs text-muted-foreground">support@saasflow.io</p>
              <p className="text-xs text-muted-foreground mt-1">Réponse: 24h</p>
            </div>
            <Button variant="outline" className="w-full">Envoyer un email</Button>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Chat Live</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Badge className="bg-green-500/20 text-green-400 mb-2">Disponible</Badge>
              <p className="text-xs text-muted-foreground">Lun-Ven 9h-18h CET</p>
              <p className="text-xs text-muted-foreground mt-1">Réponse immédiate</p>
            </div>
            <Button variant="outline" className="w-full">Démarrer chat</Button>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Téléphone</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold">Support prioritaire</p>
              <p className="text-xs text-muted-foreground">+33 1 23 45 67 89</p>
              <p className="text-xs text-muted-foreground mt-1">Professional+ uniquement</p>
            </div>
            <Button variant="outline" className="w-full">Demander rappel</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm col-span-2">
          <CardHeader>
            <CardTitle>Créer un ticket de support</CardTitle>
            <CardDescription>Décrivez votre problème en détail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Sujet</label>
              <Input placeholder="Décrivez brièvement votre problème" className="bg-zinc-900 border-white/10" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Priorité</label>
              <select className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-white/10 text-sm">
                <option>Basse</option>
                <option>Normale</option>
                <option>Haute</option>
                <option>Critique</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Description</label>
              <Textarea 
                placeholder="Fournissez autant de détails que possible"
                className="bg-zinc-900 border-white/10 min-h-40"
              />
            </div>
            <Button className="w-full">Soumettre le ticket</Button>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-amber-500" />
              <CardTitle>FAQ rapide</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 rounded-md border border-white/5 bg-white/2 cursor-pointer hover:bg-white/5">
              <p className="text-sm font-semibold">Comment déployer un site?</p>
            </div>
            <div className="p-3 rounded-md border border-white/5 bg-white/2 cursor-pointer hover:bg-white/5">
              <p className="text-sm font-semibold">Changer mon domaine?</p>
            </div>
            <div className="p-3 rounded-md border border-white/5 bg-white/2 cursor-pointer hover:bg-white/5">
              <p className="text-sm font-semibold">Augmenter mon quota?</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <CardTitle>Temps de réponse</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-blue-400">Chat</p>
              <p className="text-muted-foreground">Immédiat</p>
            </div>
            <div>
              <p className="font-semibold text-green-400">Email</p>
              <p className="text-muted-foreground">&lt; 24h</p>
            </div>
            <div>
              <p className="font-semibold text-purple-400">Téléphone</p>
              <p className="text-muted-foreground">&lt; 2h (Pro+)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
