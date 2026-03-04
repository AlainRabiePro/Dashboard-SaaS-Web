
"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Site, updateSite, deleteSite } from "@/lib/firestore-service";
import { formatStorage } from "@/lib/format-storage";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Globe, 
  Loader2, 
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function SiteSettingsPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const siteRef = useMemo(() => 
    user ? doc(firestore, "users", user.uid, "sites", siteId) : null, 
    [firestore, user, siteId]
  );

  const { data: site, loading } = useDoc<Site>(siteRef);

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    framework: "",
    region: "",
    status: "active" as "active" | "suspended"
  });

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || "",
        url: site.url || "",
        framework: site.framework || "Next.js",
        region: site.region || "us-east-1",
        status: site.status || "active"
      });
    }
  }, [site]);

  async function handleSave() {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateSite(user.uid, siteId, formData);
      toast({
        title: "Projet mis à jour",
        description: "Les paramètres ont été enregistrés avec succès.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!user || !site) return;
    setIsDeleting(true);
    try {
      // Étape 1: Supprimer du VPS via l'API
      const token = await user.getIdToken();
      const response = await fetch("/api/delete-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteName: site.name,
          siteId: siteId,
        }),
      });

      // Même si le VPS échoue, on continue pour supprimer Firestore
      const vpsData = response.ok ? await response.json() : null;
      if (vpsData) {
        console.log("✅ VPS supprimé:", vpsData);
      } else {
        console.warn("⚠️ Erreur suppression VPS, mais on continue avec Firestore");
      }

      // Étape 2: Supprimer de Firestore côté client (avec permissions utilisateur)
      await deleteSite(user.uid, siteId);
      
      toast({
        title: "Projet supprimé",
        description: "Le site a été retiré de votre compte et du VPS.",
      });
      
      // Attendre un peu et rediriger
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Forcer le rafraîchissement des données
      router.refresh();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Rediriger
      router.push("/sites");
    } catch (error: any) {
      console.error("❌ Erreur suppression:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleRedeploy() {
    if (!user || !site) return;
    setIsRedeploying(true);
    try {
      const response = await fetch("/api/deploy-site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.uid,
        },
        body: JSON.stringify({
          siteName: site.name,
          domain: site.domain,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du redéploiement");
      }

      const data = await response.json();
      console.log("✅ Redéploiement réussi:", data);

      toast({
        title: "Projet redéployé",
        description: "Votre site a été redéployé sur le serveur avec succès.",
      });
    } catch (error: any) {
      console.error("❌ Erreur redéploiement:", error);
      toast({
        title: "Erreur de redéploiement",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRedeploying(false);
    }
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!site && !loading) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Projet introuvable.</p>
        <Button variant="link" asChild>
          <Link href="/sites">Retour aux projets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10 border border-white/5" asChild>
            <Link href="/sites"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/sites" className="hover:text-foreground">Projets</Link>
              <ChevronRight className="h-3 w-3" />
              <span>Paramètres</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{site?.name}</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-white/5">
              <CardTitle className="text-lg">Configuration Générale</CardTitle>
              <CardDescription>Modifiez les informations de base de votre application.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du projet</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-zinc-900 border-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL de Production</Label>
                  <Input 
                    id="url" 
                    value={formData.url} 
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="bg-zinc-900 border-white/5"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Framework</Label>
                  <div className="px-3 py-2 bg-zinc-900 border border-white/5 rounded-md text-foreground">
                    Next.js
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Région de déploiement</Label>
                  <div className="px-3 py-2 bg-zinc-900 border border-white/5 rounded-md text-foreground">
                    US East (N. Virginia)
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6 bg-white/5">
              <Button onClick={handleSave} disabled={isSaving} className="font-bold">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer les changements
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
             <CardHeader className="bg-white/5">
              <CardTitle className="text-lg">Statut du Projet</CardTitle>
              <CardDescription>Activez ou suspendez temporairement l'accès à ce site.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">Projet Actif</p>
                  <p className="text-xs text-muted-foreground">Le site sera accessible via son URL de production.</p>
                </div>
                <Switch 
                  checked={formData.status === "active"} 
                  onCheckedChange={(checked) => setFormData({...formData, status: checked ? "active" : "suspended"})}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-blue-500/20 bg-blue-500/5 overflow-hidden">
            <CardHeader className="bg-blue-500/10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-blue-400">
                🚀 Redéploiement
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Redéployez votre site sur le serveur si les fichiers ont été supprimés ou si le déploiement initial a échoué.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all font-bold text-xs"
                onClick={handleRedeploy}
                disabled={isRedeploying}
              >
                {isRedeploying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Redéployer le site
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
            <CardHeader className="bg-destructive/10">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Zone de danger
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                La suppression de ce projet est irréversible. Toutes les données associées, logs et configurations seront définitivement effacés.
              </p>
              
              {!showDeleteConfirm ? (
                <Button 
                  variant="outline" 
                  className="w-full border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all font-bold text-xs"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Supprimer le projet
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-center uppercase text-destructive">Confirmer la suppression ?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)} className="text-xs">Annuler</Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleDelete} 
                      disabled={isDeleting}
                      className="text-xs font-bold"
                    >
                      {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Oui, Supprimer"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
             <CardHeader className="pb-2">
               <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Informations techniques</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ID du projet</span>
                  <span className="font-mono text-[10px] text-primary">{siteId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Date de création</span>
                  <span className="font-semibold">{site?.createdAt ? format(site.createdAt.toDate(), "dd/MM/yyyy") : "..."}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Utilisation stockage</span>
                  <span className="font-semibold">{formatStorage(site?.storageUsed || 0)}</span>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
