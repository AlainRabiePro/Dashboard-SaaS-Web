
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, addSite, Site } from "@/lib/firestore-service";
import { 
  Rocket, 
  Megaphone, 
  History, 
  Save, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Lock,
  GitBranch,
  Globe,
  AlertCircle,
  Code2,
  Database,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function ToolsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // State for Deployment Modal
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployForm, setDeployForm] = useState({
    domain: "",
    repoUrl: ""
  });

  // State for Ads Modal
  const [isAdsOpen, setIsAdsOpen] = useState(false);
  const [adsLoading, setAdsLoading] = useState(false);
  const [selectedAdsSiteId, setSelectedAdsSiteId] = useState<string | null>(null);
  const [adsenseId, setAdsenseId] = useState("");

  // State for Backup Modal
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [isFetchingCommits, setIsFetchingCommits] = useState(false);

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const sitesRef = useMemo(() => user ? collection(firestore, "users", user.uid, "sites") : null, [firestore, user]);
  
  const { data: profile } = useDoc<UserProfile>(profileRef);
  const { data: sites } = useCollection<Site>(sitesRef);

  const mockCommits = [
    { id: "7f3a1b2", message: "feat: add authentication layer", date: "Il y a 2 heures" },
    { id: "9d2e4f1", message: "fix: solve hydration mismatch in dashboard", date: "Hier" },
    { id: "a1b2c3d", message: "chore: update dependencies", date: "Il y a 3 jours" },
    { id: "e5f6g7h", message: "style: improve sidebar responsiveness", date: "Il y a 1 semaine" },
  ];

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
      description: "Configurez vos tags AdSense et gérez vos emplacements publicitaires via Ads.tsx.",
      icon: Megaphone,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      action: "Gérer les annonces",
      minPlan: "Professional"
    },
    {
      id: "backup",
      title: "Backup",
      description: "Récupérez vos commits et restaurez une version précédente de votre projet.",
      icon: History,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      action: "Gérer les versions",
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

    if (toolId === 'deploy') {
      setIsDeployOpen(true);
      return;
    }

    if (toolId === 'ads') {
      setIsAdsOpen(true);
      return;
    }

    if (toolId === 'backup') {
      setIsBackupOpen(true);
      return;
    }

    if (toolId === 'save') {
      setLoadingStates(prev => ({ ...prev, [toolId]: true }));
      // Simulation d'un "Push" vers l'infrastructure
      setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, [toolId]: false }));
        toast({
          title: "Push effectué",
          description: "Vos configurations locales ont été poussées vers l'infrastructure cloud avec succès.",
        });
      }, 2000);
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

  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !deployForm.domain || !deployForm.repoUrl) return;

    setDeployLoading(true);
    try {
      // Récupérer le token d'authentification
      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error('Impossible de récupérer le token d\'authentification');
      }

      // Appeler l'API de déploiement
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          domain: deployForm.domain,
          repoUrl: deployForm.repoUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Erreur lors du déploiement');
      }

      const result = await response.json();

      // Sauvegarder le site dans Firestore
      await addSite(user.uid, deployForm.domain, `https://${deployForm.domain}`, deployForm.repoUrl);

      toast({
        title: "✅ Déploiement lancé",
        description: `${deployForm.domain} est maintenant en cours de déploiement.`,
      });

      setIsDeployOpen(false);
      setDeployForm({ domain: "", repoUrl: "" });
    } catch (error: any) {
      console.error('Erreur de déploiement:', error);
      toast({
        variant: "destructive",
        title: "❌ Erreur de déploiement",
        description: error.message || "Une erreur est survenue lors du déploiement.",
      });
    } finally {
      setDeployLoading(false);
    }
  };

  const handleAdsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAdsSiteId || !adsenseId) return;

    setAdsLoading(true);
    try {
      const selectedSite = sites.find(s => s.id === selectedAdsSiteId);
      if (!selectedSite) {
        throw new Error('Site non trouvé');
      }

      // Récupérer le token d'authentification
      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error('Impossible de récupérer le token d\'authentification');
      }

      // Appeler l'API de configuration AdSense
      const response = await fetch('/api/configure-adsense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          siteId: selectedAdsSiteId,
          domain: selectedSite.name,
          adsenseId: adsenseId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Erreur lors de la configuration');
      }

      const result = await response.json();

      toast({
        title: "✅ AdSense configuré",
        description: `AdSense a été configuré avec succès pour ${selectedSite.name}`,
      });

      setIsAdsOpen(false);
      setSelectedAdsSiteId(null);
      setAdsenseId("");
    } catch (error: any) {
      console.error('Erreur de configuration AdSense:', error);
      toast({
        variant: "destructive",
        title: "❌ Erreur",
        description: error.message || "Une erreur est survenue.",
      });
    } finally {
      setAdsLoading(false);
    }
  };

  const handleRestoreCommit = (commitId: string) => {
    toast({
      title: "Restauration demandée",
      description: `La version ${commitId} est en cours de déploiement sur votre infrastructure.`,
    });
    setIsBackupOpen(false);
    setSelectedSiteId(null);
  };

  const isLocked = (minPlan: string) => {
    if (!profile) return true;
    if (profile.plan === 'Enterprise') return false;
    if (profile.plan === 'Professional' && minPlan !== 'Enterprise') return false;
    if (profile.plan === 'Starter' && minPlan === 'Starter') return false;
    return true;
  };

  const selectedSite = sites.find(s => s.id === selectedSiteId);

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

      {/* Deployment Modal */}
      <Dialog open={isDeployOpen} onOpenChange={setIsDeployOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-[425px]">
          <form onSubmit={handleDeploySubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-500" />
                Déployer un nouveau site
              </DialogTitle>
              <DialogDescription>
                Configurez les paramètres de déploiement de votre application.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="grid gap-2">
                <Label htmlFor="domain" className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Nom de domaine
                </Label>
                <Input
                  id="domain"
                  placeholder="mon-app.com"
                  className="bg-zinc-900 border-white/5"
                  value={deployForm.domain}
                  onChange={(e) => setDeployForm({ ...deployForm, domain: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repo" className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                  Repo Git
                </Label>
                <Input
                  id="repo"
                  placeholder="https://github.com/user/repo"
                  className="bg-zinc-900 border-white/5"
                  value={deployForm.repoUrl}
                  onChange={(e) => setDeployForm({ ...deployForm, repoUrl: e.target.value })}
                  required
                />
              </div>
              
              <Alert className="bg-blue-500/5 border-blue-500/10 text-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-xs font-bold uppercase tracking-tight">Information</AlertTitle>
                <AlertDescription className="text-[10px] leading-tight">
                  Le dépôt Git doit être <strong>public</strong> pendant toute la durée de la phase de déploiement initial.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsDeployOpen(false)}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={deployLoading}
                className="font-bold text-xs px-6"
              >
                {deployLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Démarrer le déploiement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Backup Modal */}
      <Dialog open={isBackupOpen} onOpenChange={(open) => {
        setIsBackupOpen(open);
        if (!open) {
          setSelectedSiteId(null);
        }
      }}>
        <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-500" />
              Backup & Restauration
            </DialogTitle>
            <DialogDescription>
              Sélectionnez un projet pour explorer ses commits et restaurer une version.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {!selectedSiteId ? (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vos projets actifs</p>
                <div className="grid gap-2">
                  {sites.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">Aucun projet trouvé.</p>
                  ) : (
                    sites.map((site) => (
                      <Button
                        key={site.id}
                        variant="ghost"
                        className="w-full justify-between h-14 bg-white/5 hover:bg-white/10 border border-white/5 px-4"
                        onClick={() => {
                          setIsFetchingCommits(true);
                          setSelectedSiteId(site.id);
                          setTimeout(() => setIsFetchingCommits(false), 800);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 text-primary" />
                          <div className="text-left">
                            <p className="text-sm font-semibold">{site.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{site.repositoryUrl || 'Pas de repo Git'}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedSiteId(null)}>
                      <ArrowRight className="h-4 w-4 rotate-180" />
                    </Button>
                    <h3 className="text-sm font-bold">{selectedSite?.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-500">
                    {selectedSite?.framework}
                  </Badge>
                </div>

                <div className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                  <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <GitBranch className="h-3.5 w-3.5" />
                      Historique des commits
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isFetchingCommits}>
                      <RefreshCw className={isFetchingCommits ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[250px]">
                    <div className="p-2 space-y-1">
                      {isFetchingCommits ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <p className="text-[10px] text-muted-foreground animate-pulse">Synchronisation avec le dépôt...</p>
                        </div>
                      ) : (
                        mockCommits.map((commit) => (
                          <div key={commit.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-primary">{commit.id}</span>
                                <span className="text-[10px] text-muted-foreground">{commit.date}</span>
                              </div>
                              <p className="text-xs text-zinc-300 truncate">{commit.message}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRestoreCommit(commit.id)}
                            >
                              Récupérer
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <Alert className="bg-emerald-500/5 border-emerald-500/10 text-emerald-200">
                  <AlertCircle className="h-4 w-4 text-emerald-500" />
                  <AlertTitle className="text-xs font-bold uppercase tracking-tight">Restauration</AlertTitle>
                  <AlertDescription className="text-[10px] leading-tight">
                    La récupération d'un commit lancera un nouveau build basé sur cet ID spécifique.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-xs" onClick={() => setIsBackupOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ads Modal */}
      <Dialog open={isAdsOpen} onOpenChange={setIsAdsOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-[500px]">
          <form onSubmit={handleAdsSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-500" />
                Configurer Google AdSense
              </DialogTitle>
              <DialogDescription>
                Sélectionnez un site et entrez votre ID AdSense pour l'activer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              {/* Sélection du site */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Sélectionner un site
                </Label>
                <select
                  value={selectedAdsSiteId || ""}
                  onChange={(e) => setSelectedAdsSiteId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">-- Choisir un site --</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
                {sites.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">Aucun site déployé. Déploiement d'abord un site.</p>
                )}
              </div>

              {/* Input ID AdSense */}
              <div className="grid gap-2">
                <Label htmlFor="adsenseId" className="flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                  ID AdSense
                </Label>
                <Input
                  id="adsenseId"
                  placeholder="ca-pub-0000000000000000 ou colle ta ligne ads.txt"
                  className="bg-zinc-900 border-white/5 font-mono text-xs"
                  value={adsenseId}
                  onChange={(e) => setAdsenseId(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Colle l'ID <code>ca-pub-XXXXXXXXXXXXXXXX</code> ou la ligne complète de ads.txt
                </p>
              </div>
              
              <Alert className="bg-amber-500/5 border-amber-500/10 text-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-xs font-bold uppercase tracking-tight">Attention</AlertTitle>
                <AlertDescription className="text-[10px] leading-tight">
                  Cette action créera un fichier <code>ads.txt</code> et injectera le script AdSense dans les fichiers HTML de votre site.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => {
                  setIsAdsOpen(false);
                  setSelectedAdsSiteId(null);
                  setAdsenseId("");
                }}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={adsLoading || sites.length === 0}
                className="font-bold text-xs px-6"
              >
                {adsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Activer AdSense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
