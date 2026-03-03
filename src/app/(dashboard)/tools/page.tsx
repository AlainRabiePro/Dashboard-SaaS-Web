
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/lib/firestore-service";
import { 
  Rocket, 
  Megaphone, 
  History, 
  Save, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Lock
} from "lucide-react";
import Link from "next/link";

export default function ToolsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  const tools = [
    {
      id: "deploy",
      title: "Déployer un site",
      description: "Lancez une nouvelle instance de votre application sur notre infrastructure optimisée.",
      icon: Rocket,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      action: "Lancer le déploiement",
      minPlan: "Professional"
    },
    {
      id: "ads",
      title: "Implémenter des pubs",
      description: "Configurez vos tags AdSense et gérez vos emplacements publicitaires.",
      icon: Megaphone,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      action: "Gérer les annonces",
      minPlan: "Professional"
    },
    {
      id: "backup",
      title: "Backup",
      description: "Créez un instantané complet de vos bases de données et fichiers sources.",
      icon: History,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      action: "Créer un backup",
      minPlan: "Starter"
    },
    {
      id: "save",
      title: "Sauvegarder",
      description: "Synchronisez manuellement vos dernières configurations avec le cloud.",
      icon: Save,
      color: "text-primary",
      bg: "bg-primary/10",
      action: "Sauvegarde forcée",
      minPlan: "Starter"
    }
  ];

  const handleToolAction = (toolId: string, title: string, isLocked: boolean) => {
    if (isLocked) {
      toast({
        variant: "destructive",
        title: "Action verrouillée",
        description: "Veuillez mettre à jour votre plan pour accéder à cet outil.",
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, [toolId]: true }));
    
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [toolId]: false }));
      toast({
        title: `${title} initié`,
        description: "L'opération a été lancée avec succès en arrière-plan.",
      });
    }, 1500);
  };

  const isLocked = (minPlan: string) => {
    if (!profile) return true;
    if (profile.plan === 'Enterprise') return false;
    if (profile.plan === 'Professional' && minPlan !== 'Enterprise') return false;
    if (profile.plan === 'Starter' && minPlan === 'Starter') return false;
    return true;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Boîte à Outils</h1>
        <p className="text-muted-foreground italic">Accédez aux outils avancés de gestion de votre infrastructure.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {tools.map((tool) => {
          const locked = isLocked(tool.minPlan);
          return (
            <Card key={tool.id} className="border-white/5 bg-zinc-950/50 backdrop-blur-sm group hover:border-white/10 transition-all overflow-hidden relative">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className={`h-12 w-12 rounded-2xl ${tool.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <CardDescription className="text-xs leading-relaxed">{tool.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {locked ? (
                  <div className="flex items-center gap-2 p-3 bg-destructive/5 rounded-xl border border-destructive/10 text-[10px] text-destructive font-bold uppercase tracking-wider">
                    Plan {tool.minPlan} requis
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-xl border border-white/5 text-[10px] text-muted-foreground">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    Vérifié et sécurisé par SaasFlow Core
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                {locked ? (
                  <Button 
                    className="w-full font-bold text-xs h-10 border-white/5 hover:bg-white/5" 
                    variant="outline"
                    asChild
                  >
                    <Link href="/storage">Upgrade Plan</Link>
                  </Button>
                ) : (
                  <Button 
                    className="w-full font-bold text-xs h-10 group/btn" 
                    variant="outline"
                    onClick={() => handleToolAction(tool.id, tool.title, false)}
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
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
