
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Rocket, 
  Megaphone, 
  History, 
  Save, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";

const tools = [
  {
    id: "deploy",
    title: "Déployer un site",
    description: "Lancez une nouvelle instance de votre application sur notre infrastructure optimisée.",
    icon: Rocket,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    action: "Lancer le déploiement"
  },
  {
    id: "ads",
    title: "Implémenter des pubs",
    description: "Configurez vos tags AdSense et gérez vos emplacements publicitaires.",
    icon: Megaphone,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    action: "Gérer les annonces"
  },
  {
    id: "backup",
    title: "Backup",
    description: "Créez un instantané complet de vos bases de données et fichiers sources.",
    icon: History,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    action: "Créer un backup"
  },
  {
    id: "save",
    title: "Sauvegarder",
    description: "Synchronisez manuellement vos dernières configurations avec le cloud.",
    icon: Save,
    color: "text-primary",
    bg: "bg-primary/10",
    action: "Sauvegarde forcée"
  }
];

export default function ToolsPage() {
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleToolAction = (toolId: string, title: string) => {
    setLoadingStates(prev => ({ ...prev, [toolId]: true }));
    
    // Simulation d'une action asynchrone
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [toolId]: false }));
      toast({
        title: `${title} initié`,
        description: "L'opération a été lancée avec succès en arrière-plan.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Boîte à Outils</h1>
        <p className="text-muted-foreground italic">Accédez aux outils avancés de gestion de votre infrastructure.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.id} className="border-white/5 bg-zinc-950/50 backdrop-blur-sm group hover:border-white/10 transition-all overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
              <div className={`h-12 w-12 rounded-2xl ${tool.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                <tool.icon className={`h-6 w-6 ${tool.color}`} />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{tool.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-xl border border-white/5 text-[10px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Vérifié et sécurisé par SaasFlow Core
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                className="w-full font-bold text-xs h-10 group/btn" 
                variant="outline"
                onClick={() => handleToolAction(tool.id, tool.title)}
                disabled={loadingStates[tool.id]}
              >
                {loadingStates[tool.id] ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <>
                    {tool.action}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5 p-8 text-center space-y-4">
        <div className="mx-auto h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-xl font-bold">Besoin d'outils personnalisés ?</h2>
          <p className="text-sm text-muted-foreground">
            Notre API permet l'intégration de vos propres scripts de déploiement et de monitoring.
          </p>
        </div>
        <Button variant="link" className="text-primary font-bold">Consulter la documentation API</Button>
      </Card>
    </div>
  );
}
