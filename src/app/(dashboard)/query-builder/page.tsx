"use client";

import { useAuth } from "@/context/AuthContext";
import { useFirestore } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useEffect, useState, useMemo } from "react";
import { collection, doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, ArrowLeft, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Site, UserProfile } from "@/lib/firestore-service";
import { QueryEditor } from "@/components/query-editor";
import { DATABASE_TYPES } from "@/lib/database-types";
import Link from "next/link";

export default function QueryBuilderPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("");

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
    }
  }, [sites, selectedSiteId]);

  const currentSite = sites?.find(s => s.id === selectedSiteId);
  const currentDatabases = currentSite?.databases ? Object.entries(currentSite.databases) : [];

  // Auto-select first database when site changes
  useEffect(() => {
    if (currentDatabases.length > 0 && !selectedDatabaseId) {
      setSelectedDatabaseId(currentDatabases[0][0]);
    } else if (currentDatabases.length === 0) {
      setSelectedDatabaseId("");
    }
  }, [currentDatabases, selectedDatabaseId]);

  const currentDatabase = currentDatabases.find(([id]) => id === selectedDatabaseId)?.[1];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/database">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Query Builder</h1>
          <p className="text-muted-foreground italic">Exécutez des requêtes SQL sur votre base de données</p>
        </div>
      </div>

      {/* Site & Database Selection */}
      {sites && sites.length > 0 ? (
        <>
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Site Selection */}
                <div>
                  <label className="text-sm font-medium">Sélectionner un projet</label>
                  <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
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
            </CardContent>
          </Card>

          {/* Query Editor */}
          {currentDatabase && currentDatabases.length > 0 && (
            <QueryEditor
              databaseType={currentDatabase.type}
              databaseConfig={currentDatabase.config}
              siteId={selectedSiteId}
              databaseId={selectedDatabaseId}
            />
          )}

          {/* No Database */}
          {currentDatabases.length === 0 && (
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Aucune base de données configurée pour ce projet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Allez à la page Database Explorer pour en ajouter une.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            {sitesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Aucun projet trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
