"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useFirestore, useDoc } from "@/firebase";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  signOut,
  deleteUser 
} from "firebase/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { UserProfile, updateUserProfile } from "@/lib/firestore-service";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Shield, Bell, Loader2, Save, Upload, Globe, Clock, 
  Key, Lock, Smartphone, LogOut, AlertCircle, Mail, HardDrive,
  Github, Trash2, MapPin, Settings, CheckCircle, Zap, Code, Eye, EyeOff, Copy, Check
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const { data: profile, loading } = useDoc<UserProfile>(profileRef);

  // States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    language: "fr",
    timezone: "Europe/Paris",
    theme: "dark",
  });

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [notifications, setNotifications] = useState({
    deployments: true,
    storage: true,
    invoices: true,
    system: true,
    security: true,
    frequency: "immediate",
  });

  const [apiKey, setApiKey] = useState("sk_live_" + Math.random().toString(36).substring(2, 15));
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Integrations states
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        language: profile.language || "fr",
        timezone: profile.timezone || "Europe/Paris",
        theme: profile.theme || "dark",
      });
      setTwoFactorEnabled(profile.twoFactorEnabled || false);
      if (profile.notifications) {
        setNotifications(profile.notifications);
      }
    }
  }, [profile]);

  // Vérifier le callback GitHub OAuth
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const githubConnectedParam = searchParams.get("github_connected");
    const githubUsernameParam = searchParams.get("github_username");
    const githubErrorParam = searchParams.get("github_error");

    if (githubConnectedParam === "true" && githubUsernameParam) {
      setGithubConnected(true);
      setGithubUsername(githubUsernameParam);
      toast({
        title: "✅ GitHub connecté!",
        description: `Connecté en tant que @${githubUsernameParam}`,
      });
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, "/settings");
    } else if (githubErrorParam) {
      toast({
        title: "Erreur de connexion GitHub",
        description: githubErrorParam,
      });
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, "/settings");
    }
  }, [toast]);

  // Handlers
  async function handleSaveProfile() {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { 
        name: formData.name,
        language: formData.language,
        timezone: formData.timezone,
        theme: formData.theme,
      });
      toast({
        title: "✨ Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!user || !user.email) return;
    
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas.",
      });
      return;
    }

    if (passwordData.new.length < 8) {
      toast({
        title: "Erreur",
        description: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordData.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.new);
      await updateUserProfile(user.uid, {
        lastPasswordChange: new Date().toISOString(),
      });

      toast({
        title: "🔒 Mot de passe changé",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });

      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message === "Firebase: Error (auth/wrong-password)." 
          ? "Le mot de passe actuel est incorrect." 
          : "Impossible de changer le mot de passe.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleToggle2FA(enabled: boolean) {
    if (!user) return;
    
    try {
      await updateUserProfile(user.uid, {
        twoFactorEnabled: enabled,
      });
      
      setTwoFactorEnabled(enabled);
      toast({
        title: enabled ? "🔐 2FA activée" : "2FA désactivée",
        description: enabled 
          ? "L'authentification à deux facteurs est maintenant active."
          : "L'authentification à deux facteurs a été désactivée.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres de sécurité.",
      });
    }
  }

  async function handleSaveNotifications() {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
        notifications: notifications,
      });
      toast({
        title: "✅ Préférences sauvegardées",
        description: "Vos paramètres de notification ont été mis à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user || deleteConfirmText !== "SUPPRIMER") return;
    
    setIsDeletingAccount(true);
    try {
      await updateUserProfile(user.uid, {
        deletedAt: new Date().toISOString(),
      });
      
      // Delete user account (requires recent authentication)
      await deleteUser(user);
      
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé de manière permanente.",
      });
      
      // Redirect to home
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le compte.",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }

  function copyApiKey() {
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
    toast({
      title: "Copié",
      description: "La clé API a été copiée dans le presse-papiers.",
    });
  }

  function regenerateApiKey() {
    setApiKey("sk_live_" + Math.random().toString(36).substring(2, 15));
    toast({
      title: "🔑 Clé régénérée",
      description: "Une nouvelle clé API a été générée.",
    });
  }

  async function handleConnectGithub() {
    try {
      // Construire l'URL OAuth GitHub
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      
      if (!clientId) {
        toast({
          title: "Erreur de configuration",
          description: "NEXT_PUBLIC_GITHUB_CLIENT_ID n'est pas configuré.",
        });
        return;
      }
      
      const redirectUri = `${window.location.origin}/api/github/callback`;
      const scopes = ["user:email", "read:user"];
      const state = Math.random().toString(36).substring(2, 15); // Token de sécurité
      
      // Sauvegarder le state dans sessionStorage pour la vérification
      sessionStorage.setItem('github_oauth_state', state);
      
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join("+")}&state=${state}`;
      
      // Rediriger directement vers GitHub
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de connecter votre compte GitHub.",
      });
    }
  }

  async function handleDisconnectGithub() {
    try {
      setGithubConnected(false);
      setGithubUsername(null);
      toast({
        title: "✅ GitHub déconnecté",
        description: "Votre compte GitHub a été déconnecté.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter votre compte GitHub.",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement de vos paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/70 to-primary/40 border border-primary/30 p-8 md:p-12">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-6 w-6" />
            <span className="text-sm font-semibold text-primary-foreground/80">Tableau de contrôle</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Paramètres</h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">Personnalisez votre profil, gérez votre sécurité et configurez vos préférences d'application.</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-zinc-950 border border-primary/20 p-1 h-auto grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary/30 gap-2 py-3">
            <User className="h-5 w-5" />
            <span className="hidden sm:inline text-sm">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary/30 gap-2 py-3">
            <Shield className="h-5 w-5" />
            <span className="hidden sm:inline text-sm">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/30 gap-2 py-3">
            <Bell className="h-5 w-5" />
            <span className="hidden sm:inline text-sm">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-primary/30 gap-2 py-3">
            <Code className="h-5 w-5" />
            <span className="hidden sm:inline text-sm">Intégrations</span>
          </TabsTrigger>
        </TabsList>

        {/* PROFIL TAB */}
        <TabsContent value="profile" className="space-y-6">
          {/* Avatar Section */}
          <Card className="border-white/5 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profil Utilisateur
              </CardTitle>
              <CardDescription>Gérez vos informations personnelles et votre avatar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Avatar Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-5xl shadow-lg">
                    {formData.name.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <Label className="text-sm font-semibold">Photo de profil</Label>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou GIF • Max 2 MB</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
                    <Upload className="h-4 w-4 mr-2" />
                    Changer l'avatar
                  </Button>
                  <p className="text-xs text-muted-foreground italic">Cliquez ou glissez une image pour la mettre à jour</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-semibold">Nom Complet</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-zinc-900/50 border-white/5 focus:border-primary/50 focus:ring-primary/20 h-10"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-semibold">Email <span className="text-xs text-muted-foreground">(Lecture seule)</span></Label>
                    <Input 
                      id="email" 
                      value={formData.email} 
                      disabled 
                      className="bg-zinc-900/30 border-white/5 opacity-60 cursor-not-allowed h-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6 bg-white/2">
              <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </CardFooter>
          </Card>

          {/* Localisation Section */}
          <Card className="border-white/5 bg-gradient-to-br from-blue/5 via-transparent to-transparent backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Localisation
              </CardTitle>
              <CardDescription>Configurez votre langue et fuseau horaire.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language" className="font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    Langue
                  </Label>
                  <select 
                    id="language"
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="w-full p-2 bg-zinc-900/50 border border-white/5 rounded-lg text-sm focus:border-primary/50 focus:ring-primary/20 cursor-pointer hover:bg-zinc-900"
                  >
                    <option value="fr">🇫🇷 Français (FR)</option>
                    <option value="en">🇬🇧 English (EN)</option>
                    <option value="es">🇪🇸 Español (ES)</option>
                    <option value="de">🇩🇪 Deutsch (DE)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Fuseau Horaire
                  </Label>
                  <select 
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                    className="w-full p-2 bg-zinc-900/50 border border-white/5 rounded-lg text-sm focus:border-primary/50 focus:ring-primary/20 cursor-pointer hover:bg-zinc-900"
                  >
                    <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="America/New_York">America/New_York (GMT-5)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (GMT-8)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-primary hover:bg-primary/90">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SÉCURITÉ TAB */}
        <TabsContent value="security" className="space-y-6">
          {/* Mot de passe */}
          <Card className="border-white/5 bg-gradient-to-br from-orange/5 via-transparent to-transparent backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-orange-500" />
                Mot de passe
              </CardTitle>
              <CardDescription>Changez régulièrement votre mot de passe pour sécuriser votre compte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current" className="font-semibold">Mot de passe actuel</Label>
                <Input 
                  id="current" 
                  type="password" 
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  className="bg-zinc-900/50 border-white/5 focus:border-primary/50 focus:ring-primary/20" 
                  placeholder="••••••••" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new" className="font-semibold">Nouveau mot de passe</Label>
                <Input 
                  id="new" 
                  type="password" 
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  className="bg-zinc-900/50 border-white/5 focus:border-primary/50 focus:ring-primary/20" 
                  placeholder="••••••••" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm" className="font-semibold">Confirmer le mot de passe</Label>
                <Input 
                  id="confirm" 
                  type="password" 
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  className="bg-zinc-900/50 border-white/5 focus:border-primary/50 focus:ring-primary/20" 
                  placeholder="••••••••" 
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6">
              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword}
                className="bg-primary hover:bg-primary/90"
              >
                {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                {isChangingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </CardFooter>
          </Card>

          {/* Authentification à deux facteurs */}
          <Card className="border-white/5 bg-gradient-to-br from-green/5 via-transparent to-transparent backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-500" />
                Authentification à deux facteurs (2FA)
              </CardTitle>
              <CardDescription>Renforcez la sécurité de votre compte avec une vérification supplémentaire.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-white/2 hover:bg-white/5 transition-colors">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">2FA par Email</p>
                  <p className="text-xs text-muted-foreground">Recevez un code à 6 chiffres lors de chaque connexion.</p>
                </div>
                <Switch 
                  checked={twoFactorEnabled}
                  onCheckedChange={handleToggle2FA}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sessions actives */}
          <Card className="border-white/5 bg-gradient-to-br from-blue/5 via-transparent to-transparent backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-blue-500" />
                Sessions actives
              </CardTitle>
              <CardDescription>Gérez vos sessions connectées sur d'autres appareils.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-white/5 rounded-lg bg-white/2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Chrome sur Windows</p>
                  <p className="text-xs text-muted-foreground">Actif maintenant • Paris, France</p>
                </div>
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-0">Actif</Badge>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6">
              <Button 
                variant="destructive" 
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnecter tous les appareils
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Notifications Email */}
          <Card className="border-white/5 bg-gradient-to-br from-purple/5 via-transparent to-transparent backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-500" />
                Alertes Email
              </CardTitle>
              <CardDescription>Choisissez les événements pour lesquels vous souhaitez être notifié par email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-white/2 hover:bg-white/5 transition-colors">
                <div className="space-y-1 flex-1">
                  <Label className="font-semibold text-sm">Rapports de déploiement</Label>
                  <p className="text-xs text-muted-foreground">Recevez un email après chaque déploiement réussi.</p>
                </div>
                <Switch 
                  checked={notifications.deployments}
                  onCheckedChange={(v) => setNotifications({...notifications, deployments: v})}
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-white/2 hover:bg-white/5 transition-colors">
                <div className="space-y-1 flex-1">
                  <Label className="font-semibold text-sm">Alertes de stockage</Label>
                  <p className="text-xs text-muted-foreground">Notifiez-moi lorsque j'atteins 90% de mon quota.</p>
                </div>
                <Switch 
                  checked={notifications.storage}
                  onCheckedChange={(v) => setNotifications({...notifications, storage: v})}
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-white/2 hover:bg-white/5 transition-colors">
                <div className="space-y-1 flex-1">
                  <Label className="font-semibold text-sm">Nouvelles factures</Label>
                  <p className="text-xs text-muted-foreground">Recevez vos factures par email au format PDF.</p>
                </div>
                <Switch 
                  checked={notifications.invoices}
                  onCheckedChange={(v) => setNotifications({...notifications, invoices: v})}
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-white/2 hover:bg-white/5 transition-colors">
                <div className="space-y-1 flex-1">
                  <Label className="font-semibold text-sm">Alertes système</Label>
                  <p className="text-xs text-muted-foreground">Soyez notifié des problèmes de sécurité et des erreurs.</p>
                </div>
                <Switch 
                  checked={notifications.system}
                  onCheckedChange={(v) => setNotifications({...notifications, system: v})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Préférences de notification */}
          <Card className="border-white/5 bg-gradient-to-br from-cyan/5 via-transparent to-transparent backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-cyan-500" />
                Fréquence de notification
              </CardTitle>
              <CardDescription>Définissez comment et quand vous souhaitez être notifié.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-white/5 rounded-lg cursor-pointer hover:bg-white/5">
                  <input 
                    type="radio" 
                    name="frequency" 
                    id="immediate" 
                    checked={notifications.frequency === "immediate"}
                    onChange={() => setNotifications({...notifications, frequency: "immediate"})}
                    className="cursor-pointer" 
                  />
                  <Label htmlFor="immediate" className="flex-1 cursor-pointer font-semibold text-sm">
                    Notifications immédates
                  </Label>
                  <span className="text-xs text-muted-foreground">Récevez les alertes en temps réel</span>
                </div>
                <div className="flex items-center gap-3 p-3 border border-white/5 rounded-lg cursor-pointer hover:bg-white/5">
                  <input 
                    type="radio" 
                    name="frequency" 
                    id="daily" 
                    checked={notifications.frequency === "daily"}
                    onChange={() => setNotifications({...notifications, frequency: "daily"})}
                    className="cursor-pointer" 
                  />
                  <Label htmlFor="daily" className="flex-1 cursor-pointer font-semibold text-sm">
                    Résumé quotidien
                  </Label>
                  <span className="text-xs text-muted-foreground">Synthèse des alertes une fois par jour</span>
                </div>
                <div className="flex items-center gap-3 p-3 border border-white/5 rounded-lg cursor-pointer hover:bg-white/5">
                  <input 
                    type="radio" 
                    name="frequency" 
                    id="weekly" 
                    checked={notifications.frequency === "weekly"}
                    onChange={() => setNotifications({...notifications, frequency: "weekly"})}
                    className="cursor-pointer" 
                  />
                  <Label htmlFor="weekly" className="flex-1 cursor-pointer font-semibold text-sm">
                    Résumé hebdomadaire
                  </Label>
                  <span className="text-xs text-muted-foreground">Résumé des événements une fois par semaine</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/5 pt-6">
              <Button 
                onClick={handleSaveNotifications}
                disabled={isSaving}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Sauvegarder les préférences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* INTÉGRATIONS TAB */}
        <TabsContent value="integrations" className="space-y-6">
          {/* API Key */}
          <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Code className="h-5 w-5 text-indigo-400" />
                </div>
                Clé API
              </CardTitle>
              <CardDescription>Utilisez votre clé API pour les requêtes d'authentification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-900/50 border border-indigo-500/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">Clé API</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="hover:bg-white/5"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm bg-zinc-950 border border-white/10 rounded px-3 py-2">
                    {showApiKey ? apiKey : "••••••••••••••••••••••••"}
                  </code>
                  <Button 
                    size="sm"
                    onClick={copyApiKey}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {copiedApiKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Gardez votre clé API secrète et ne la partagez jamais
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={regenerateApiKey}
                  className="border-indigo-500/20 hover:bg-indigo-500/10"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Régénérer la clé
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Intégrations externes */}
          <Card className="border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <Github className="h-5 w-5 text-teal-400" />
                </div>
                Intégrations externes
              </CardTitle>
              <CardDescription>Connectez vos comptes externes pour une meilleure expérience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-teal-500/20 rounded-lg bg-teal-500/5 hover:bg-teal-500/10 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Github className="h-5 w-5 text-teal-400" />
                  <div>
                    <p className="font-semibold text-sm">GitHub</p>
                    {githubConnected ? (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Connecté en tant que <span className="font-mono text-teal-400">@{githubUsername}</span>
                        </p>
                        <div className="flex items-center gap-1 pt-1">
                          <div className="h-2 w-2 rounded-full bg-green-400"></div>
                          <span className="text-xs text-green-400">Connecté</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Connectez votre compte GitHub pour accéder aux repos</p>
                    )}
                  </div>
                </div>
                {githubConnected ? (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleDisconnectGithub}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Déconnecter
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={handleConnectGithub}
                    disabled={isConnectingGithub}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isConnectingGithub ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <Github className="mr-2 h-4 w-4" />
                        Connecter
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Zone de suppression - En bas */}
      <div className="border-t border-white/5 pt-8">
        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/10 via-transparent to-transparent backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </div>
              Zone de danger
            </CardTitle>
            <CardDescription className="text-red-300/70">Actions irréversibles pour votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              La suppression de votre compte est permanente et ne peut pas être annulée.
            </p>
            {!showDeleteConfirm ? (
              <Button 
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer mon compte
              </Button>
            ) : (
              <div className="space-y-4 p-4 border border-red-500/20 rounded-lg bg-red-500/5">
                <p className="text-sm font-semibold text-red-300">
                  ⚠️ Êtes-vous vraiment sûr ? Cette action est irréversible.
                </p>
                <p className="text-xs text-muted-foreground">
                  Tapez <span className="font-mono font-bold">SUPPRIMER</span> pour confirmer
                </p>
                <Input 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="bg-zinc-900/50 border-red-500/20 focus:border-red-500/50 focus:ring-red-500/20"
                  placeholder="SUPPRIMER"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    className="border-white/10 hover:bg-white/5 flex-1"
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || deleteConfirmText !== "SUPPRIMER"}
                    className="bg-red-600 hover:bg-red-700 flex-1"
                  >
                    {isDeletingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Supprimer définitivement
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Badge Component
function Badge({ children, className = "" }: any) {
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/70 ${className}`}>
      {children}
    </span>
  );
}
