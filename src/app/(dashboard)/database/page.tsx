"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Plus, Download, Upload, Loader2, ChevronDown, ChevronRight, HardDrive, FileJson, Settings, AlertCircle, Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useEffect, useState, useMemo, useRef } from "react";
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
  const [selectedDatabaseType, setSelectedDatabaseType] = useState<string>("");
  const [collections, setCollections] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);
  const [storageUsed, setStorageUsed] = useState(234);
  const [storageLimit] = useState(5120);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [detectedDatabases, setDetectedDatabases] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Récupérer le profil utilisateur
  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  // Récupérer les sites de l'utilisateur
  const sitesRef = useMemo(() => user ? collection(firestore, "users", user.uid, "sites") : null, [firestore, user]);
  const { data: sites, loading: sitesLoading } = useCollection<Site>(sitesRef);

  // Sélectionner automatiquement le premier site et détecter ses bases
  useEffect(() => {
    if (sites && sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
      setSelectedSite(sites[0]);
      autoDetectDatabases(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  // Auto-détecter les bases de données disponibles
  const autoDetectDatabases = async (siteId: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/auto-detect-databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
        body: JSON.stringify({
          siteId,
          vpsPath: selectedSite?.siteName,
        }),
      });

      if (!response.ok) throw new Error('Detection failed');

      const data = await response.json();
      setDetectedDatabases(data.databases || []);

      // Auto-select the default database
      const defaultDb = data.databases?.find((db: any) => db.isDefault);
      if (defaultDb) {
        setSelectedDatabaseType(defaultDb.type);
        setCollections(defaultDb.collections || []);
      }
    } catch (error) {
      console.error('Auto-detection error:', error);
      // Fallback to default
      setDetectedDatabases([
        {
          type: 'firestore',
          name: 'Firestore (Firebase)',
          status: 'default',
          collections: [],
          isDefault: true,
        }
      ]);
      setSelectedDatabaseType('firestore');
    }
  };

  // Charger les données depuis la base détectée
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !selectedSiteId || !selectedDatabaseType) {
        setLoading(false);
        return;
      }

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
            type: selectedDatabaseType,
          }),
        });

        const data = await response.json();
        setCollections(data.collections || []);
      } catch (error) {
        console.error('Error fetching collections:', error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedSiteId, selectedDatabaseType]);

  const handleSiteSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
    const site = sites?.find(s => s.id === siteId);
    if (site) {
      setSelectedSite(site);
      autoDetectDatabases(siteId);
    }
  };

  // Export database
  const handleExport = async () => {
    if (!user || !selectedSiteId || !selectedDatabaseType) return;

    setExportLoading(true);
    try {
      const response = await fetch('/api/database/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
        body: JSON.stringify({
          siteId: selectedSiteId,
          type: selectedDatabaseType,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      
      // Download JSON file
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data.data, null, 2)));
      element.setAttribute('download', data.filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setMessage({ type: 'success', text: 'Export réussi!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'export' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setExportLoading(false);
    }
  };

  // Import database
  const handleImport = async (file: File) => {
    if (!user || !selectedSiteId) return;

    setImportLoading(true);
    try {
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);

      const response = await fetch('/api/database/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
        body: JSON.stringify({
          siteId: selectedSiteId,
          importData,
        }),
      });

      if (!response.ok) throw new Error('Import failed');

      const data = await response.json();
      setMessage({ type: 'success', text: `${data.importedCount} collection(s) importée(s)!` });
      
      // Recharger les collections
      setTimeout(() => {
        autoDetectDatabases(selectedSiteId);
        setMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'import' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Backup database
  const handleBackup = async () => {
    if (!user || !selectedSiteId || !selectedDatabaseType) return;

    setBackupLoading(true);
    try {
      const response = await fetch('/api/database/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
        },
        body: JSON.stringify({
          siteId: selectedSiteId,
          type: selectedDatabaseType,
        }),
      });

      if (!response.ok) throw new Error('Backup failed');

      const data = await response.json();
      setMessage({ type: 'success', text: data.message });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Backup error:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setBackupLoading(false);
    }
  };

  const currentSite = selectedSite;
  const currentDatabase = detectedDatabases.find(db => db.type === selectedDatabaseType);

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

      {message && (
        <div className={`p-4 rounded-md flex items-center gap-2 ${message.type === 'success' ? 'bg-green-900/20 border border-green-500/30 text-green-300' : 'bg-red-900/20 border border-red-500/30 text-red-300'}`}>
          {message.type === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

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
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Database Type Selection - Auto-detected */}
                  {detectedDatabases.length > 0 && (
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        Base de données
                        <Badge variant="outline" className="bg-green-500/10 text-green-300 text-xs">Détectée automatiquement</Badge>
                      </label>
                      <Select value={selectedDatabaseType} onValueChange={setSelectedDatabaseType}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choisir une base..." />
                        </SelectTrigger>
                        <SelectContent>
                          {detectedDatabases.map((db) => (
                            <SelectItem key={db.type} value={db.type}>
                              {db.name}
                              {db.isDefault && ' (Défaut)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Auto-detection status */}
                {loading && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/30">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-sm text-blue-300">Détection automatique en cours...</span>
                  </div>
                )}

                {detectedDatabases.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {detectedDatabases.map(db => (
                      <Badge 
                        key={db.type}
                        variant="outline" 
                        className={`cursor-pointer ${selectedDatabaseType === db.type ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5'}`}
                        onClick={() => setSelectedDatabaseType(db.type)}
                      >
                        {db.name}
                        {db.status === 'detected' && ' ✓'}
                        {db.status === 'likely' && ' ~'}
                        {db.status === 'default' && ' *'}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* No Database Warning */}
          {detectedDatabases.length === 0 && !loading && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-yellow-200">Aucune base de données détectée</p>
                    <p className="text-xs text-yellow-300 mt-1">
                      La détection automatique n'a trouvé aucune base. Configurez une base de données dans les paramètres du projet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Database Content */}
          {selectedDatabaseType && detectedDatabases.length > 0 && (
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
            ) : Array.isArray(collections) && collections.length > 0 ? (
              <div className="space-y-2">
                {collections.map((col: any, idx: number) => (
                  <div key={idx}>
                    <button
                      onClick={() => setExpandedCollection(expandedCollection === `col-${idx}` ? null : `col-${idx}`)}
                      className="w-full p-3 rounded-md border border-white/5 bg-white/2 cursor-pointer hover:bg-white/5 text-left transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedCollection === `col-${idx}` ? (
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
                    
                    {expandedCollection === `col-${idx}` && col.data && col.data.length > 0 && (
                      <div className="mt-2 ml-4 space-y-2 border-l border-pink-500/20 pl-4">
                        {col.data.map((doc: any, docIdx: number) => (
                          <div key={docIdx} className="p-3 rounded-md bg-zinc-900/50 border border-pink-500/10 text-xs hover:border-pink-500/30 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                              <FileJson className="h-3 w-3 text-pink-400" />
                              <p className="font-mono text-blue-400">{doc.id || `doc-${docIdx}`}</p>
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
            ) : collections && !Array.isArray(collections) && Object.keys(collections).length > 0 ? (
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
            <Button 
              onClick={handleExport}
              disabled={exportLoading || !selectedDatabaseType}
              variant="outline" 
              className="flex items-center justify-center gap-2 py-6 hover:bg-blue-500/10"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exporter
            </Button>

            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImport(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading || !selectedDatabaseType}
                variant="outline" 
                className="w-full flex items-center justify-center gap-2 py-6 hover:bg-green-500/10"
              >
                {importLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Importer
              </Button>
            </div>

            <Button 
              onClick={handleBackup}
              disabled={backupLoading || !selectedDatabaseType}
              variant="outline" 
              className="flex items-center justify-center gap-2 py-6 hover:bg-purple-500/10"
            >
              {backupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
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
        </Card>
            </div>
          )}
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
            // Redétecter automatiquement les bases après configuration
            autoDetectDatabases(selectedSiteId);
          }}
        />
      )}
    </div>
  );
}
