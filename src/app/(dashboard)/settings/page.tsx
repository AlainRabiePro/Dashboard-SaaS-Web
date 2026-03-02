
"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { UserProfile, updateUserProfile } from "@/lib/firestore-service";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, Bell, Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const { data: profile, loading } = useDoc<UserProfile>(profileRef);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
      });
    }
  }, [profile]);

  async function handleSaveProfile() {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { name: formData.name });
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte et vos préférences d'application.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-zinc-950 border border-white/5 p-1 h-12">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white/5 gap-2 px-6">
            <User className="h-4 w-4" /> Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white/5 gap-2 px-6">
            <Shield className="h-4 w-4" /> Sécurité
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white/5 gap-2 px-6">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Mettez à jour votre nom d'affichage et vos coordonnées.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
                  {formData.name.charAt(0) || "U"}
                </div>
                <div className="space-y-1">
                  <Button variant="outline" size="sm" className="h-8 border-white/10 hover:bg-white/5">Changer l'avatar</Button>
                  <p className="text-[10px] text-muted-foreground italic">JPG, PNG ou GIF. Max 1MB.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom Complet</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-zinc-900 border-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Lecture seule)</Label>
                  <Input 
                    id="email" 
                    value={formData.email} 
                    disabled 
                    className="bg-zinc-900 border-white/5 opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer les modifications
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Localisation</CardTitle>
              <CardDescription>Configurez votre fuseau horaire et votre langue par défaut.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Langue</Label>
                <div className="p-2 bg-zinc-900 border border-white/5 rounded-md text-sm">Français (FR)</div>
              </div>
              <div className="space-y-2">
                <Label>Fuseau Horaire</Label>
                <div className="p-2 bg-zinc-900 border border-white/5 rounded-md text-sm">Europe/Paris (GMT+1)</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Mot de passe</CardTitle>
              <CardDescription>Changez votre mot de passe pour sécuriser votre compte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid gap-2">
                  <Label htmlFor="current">Mot de passe actuel</Label>
                  <Input id="current" type="password" className="bg-zinc-900 border-white/5" />
               </div>
               <div className="grid gap-2">
                  <Label htmlFor="new">Nouveau mot de passe</Label>
                  <Input id="new" type="password" className="bg-zinc-900 border-white/5" />
               </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6">
              <Button variant="secondary">Mettre à jour le mot de passe</Button>
            </CardFooter>
          </Card>

          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Authentification à deux facteurs</CardTitle>
              <CardDescription>Ajoutez une couche de sécurité supplémentaire à votre compte.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between p-6 bg-zinc-900/30 rounded-xl border border-white/5">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">2FA par Email</p>
                <p className="text-xs text-muted-foreground">Recevez un code de vérification lors de chaque connexion.</p>
              </div>
              <Switch />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Alertes Système</CardTitle>
              <CardDescription>Choisissez les événements pour lesquels vous souhaitez être notifié.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg">
                <div className="space-y-0.5">
                  <Label>Rapports de déploiement</Label>
                  <p className="text-[10px] text-muted-foreground italic">Recevez un email après chaque déploiement réussi.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg">
                <div className="space-y-0.5">
                  <Label>Alertes de stockage</Label>
                  <p className="text-[10px] text-muted-foreground italic">Notifiez-moi lorsque j'atteins 90% de mon quota.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg">
                <div className="space-y-0.5">
                  <Label>Nouvelles factures</Label>
                  <p className="text-[10px] text-muted-foreground italic">Recevez vos factures par email au format PDF.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
