"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Plus, Download, Upload, Loader2, ChevronDown, ChevronRight, HardDrive, FileJson, Settings, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useEffect, useState, useMemo } from "react";
import { collection, doc } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Site, UserProfile } from "@/lib/firestore-service";
import { DatabaseConfigDialog } from "@/components/database-config-dialog";
import { DATABASE_TYPES } from "@/lib/database-types";

export default function DatabasePage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("");
  const [collections, setCollections] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);
  const [storageUsed, setStorageUsed] = useState(234);
  const [storageLimit] = useState(5120);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // Récupérer le profil utilisateur
  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  // Récupérer les sites de l'utilisateur
  const sitesRef = useMemo(() => user ? collection(firestore, "users", user.uid, "sites") : null, [firestore, user]);
  const { data: sites, loading: sitesLoading } = useCollection<Site>(sitesRef);

  // Sélectionner automatiquement le premier site
  useEffect(() => {
    if (sites && sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
      setSelectedSite(sites[0]);
    }
  }, [sites, selectedSiteId]);

  // Charger les données depuis la base du site sélectionné
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !selectedSiteId || !selectedDatabaseId) {
        setLoading(false);
        return;
      }

      const site = sites?.find(s => s.id === selectedSiteId);
      if (!site || !site.databases?.[selectedDatabaseId]) {
        setCollections(null);
        setLoading(false);
        return;
      }

      const db = site.databases[selectedDatabaseId];
      setLoading(true);

      try {
        const response = await fetch('/api/fetch-database-collections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.uid,
          },
          body: JSON.stringify({
            siteId: selectedSiteId,
            databaseId: selectedDatabaseId,
            type: db.type,
            config: db.config,
          }),
        });

        const data = await response.json();
        setCollections(data.collections);
      } catch (error) {
        console.error('Error fetching collections:', error);
        setCollections(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedSiteId, selectedDatabaseId, sites]);

  const handleSiteSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
    setSelectedDatabaseId(""); // Reset database selection
    const site = sites?.find(s => s.id === siteId);
    if (site) {
      setSelectedSite(site);
      // Auto-select the default database
      if (site.databases) {
        const defaultDb = Object.entries(site.databases).find(([_, db]) => db.isDefault);
        if (defaultDb) {
          setSelectedDatabaseId(defaultDb[0]);
        } else if (Object.keys(site.databases).length > 0) {
          setSelectedDatabaseId(Object.keys(site.databases)[0]);
        }
      }
    }
  };

  const currentSite = selectedSite;
  const currentDatabases = currentSite?.databases ? Object.entries(currentSite.databases) : [];
  const currentDatabase = currentDatabases.find(([id]) => id === selectedDatabaseId)?.[1];

  const storagePercentage = (storageUsed / storageLimit) * 100;
  const getStorageColor = () => {
    if (storagePercentage < 50) return 'bg-green-500';
    if (storagePercentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Database Explorer</h1>
        <p className="text-muted-foreground italic">Visualisez et gérez vos bases de données (Firestore, Supabase, MySQL, MariaDB, PostgreSQL, MongoDB).</p>
      </div>

      {/* Site & Database Selection */}
      {sites && sites.length > 0 ? (
        <>
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Site Selection */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Sélectionner un projet</label>
                    <Select value={selectedSiteId} onValueChange={handleSiteSelect}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choisir un projet..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                            {site.databases && Object.keys(site.databases).length > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({Object.keys(site.databases).length})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Database Selection */}
                  {currentDatabases.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Sélectionner une base</label>
                      <Select value={selectedDatabaseId} onValueChange={setSelectedDatabaseId}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choisir une base..." />
                        </SelectTrigger>
                        <SelectContent>
                          {currentDatabases.map(([dbId, db]) => (
                            <SelectItem key={dbId} value={dbId}>
                              <div className="flex items-center gap-2">
                                {db.name}
                                <span className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                                  {DATABASE_TYPES[db.type]?.label}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button 
                  onClick={() => setIsConfigDialogOpen(true)}
                  variant="outline" 
                  className="w-full gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Gérer les bases de données
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* No Database Warning */}
          {currentDatabases.length === 0 && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-yellow-200">Aucune base de données configurée</p>
                    <p className="text-xs text-yellow-300 mt-1">
                      Cliquez sur "Gérer les bases de données" pour ajouter votre première base (Firestore, Supabase, MySQL, etc.).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Database Content */}
          {currentDatabase && currentDatabases.length > 0 && (
            <div className="grid gap-6">
        {/* Collections Section */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-pink-500" />
                <CardTitle>Collections</CardTitle>
              </div>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> 
                Nouvelle collection
              </Button>
            </div>
            <CardDescription>Navigateur de collections Firestore</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : collections && Object.keys(collections).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(collections).map(([key, col]: [string, any]) => (
                  <div key={key}>
                    <button
                      onClick={() => setExpandedCollection(expandedCollection === key ? null : key)}
                      className="w-full p-3 rounded-md border border-white/5 bg-white/2 cursor-pointer hover:bg-white/5 text-left transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedCollection === key ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <p className="font-semibold text-sm">{col.name}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {col.count || 0} documents
                        </Badge>
                      </div>
                    </button>
                    
                    {expandedCollection === key && col.data && col.data.length > 0 && (
                      <div className="mt-2 ml-4 space-y-2 border-l border-pink-500/20 pl-4">
                        {col.data.map((doc: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-md bg-zinc-900/50 border border-pink-500/10 text-xs hover:border-pink-500/30 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                              <FileJson className="h-3 w-3 text-pink-400" />
                              <p className="font-mono text-blue-400">{doc.id}</p>
                            </div>
                            <pre className="text-[10px] text-muted-foreground overflow-auto max-h-32 bg-black/30 p-2 rounded">
                              {JSON.stringify(doc, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Aucune collection trouvée</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Management Tools Section */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Outils de gestion</CardTitle>
            <CardDescription>Sauvegardez, restaurez et exportez votre base</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="flex items-center justify-center gap-2 py-6 hover:bg-blue-500/10">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2 py-6 hover:bg-green-500/10">
              <Upload className="h-4 w-4" />
              Importer
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2 py-6 hover:bg-purple-500/10">
              <Database className="h-4 w-4" />
              Sauvegarder
            </Button>
          </CardContent>
        </Card>

        {/* Storage Usage Section */}
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-cyan-500" />
                  Stockage utilisé
                </CardTitle>
                <CardDescription>Vue détaillée de votre utilisation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Storage Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Données stockées</span>
                  <span className={`font-semibold text-sm ${storagePercentage > 80 ? 'text-red-400' : storagePercentage > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {(storageUsed / 1024).toFixed(2)} GB / {(storageLimit / 1024).toFixed(1)} GB
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${getStorageColor()}`}
                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {storagePercentage.toFixed(1)}% utilisé
                </p>
              </div>

              {/* Storage Breakdown */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-3 rounded-md bg-zinc-900/50 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Utilisé</p>
                  <p className="font-semibold text-sm text-green-400">{(storageUsed / 1024).toFixed(2)} GB</p>
                </div>
                <div className="p-3 rounded-md bg-zinc-900/50 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Disponible</p>
                  <p className="font-semibold text-sm text-blue-400">{((storageLimit - storageUsed) / 1024).toFixed(2)} GB</p>
                </div>
                <div className="p-3 rounded-md bg-zinc-900/50 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Limite</p>
                  <p className="font-semibold text-sm text-cyan-400">{(storageLimit / 1024).toFixed(1)} GB</p>
                </div>
              </div>
            </div>
          </CardContent>
            </div>
          )}

          {/* No sites message */}
          {sitesLoading && (
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Aucun projet trouvé</p>
              <p className="text-xs text-muted-foreground mt-1">Créez un projet depuis la section "Projets" pour commencer.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Config Dialog */}
      {selectedSite && (
        <DatabaseConfigDialog
          isOpen={isConfigDialogOpen}
          onOpenChange={setIsConfigDialogOpen}
          site={selectedSite}
          onConfigUpdated={() => {
            // Recharger les sites
            if (sites) {
              const updatedSite = sites.find(s => s.id === selectedSiteId);
              if (updatedSite) {
                setSelectedSite(updatedSite);
                // Auto-select first database
                if (updatedSite.databases && Object.keys(updatedSite.databases).length > 0) {
                  setSelectedDatabaseId(Object.keys(updatedSite.databases)[0]);
                }
              }
            }
          }}
        />
      )}
    </div>
  );
}
