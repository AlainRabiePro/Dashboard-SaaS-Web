"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Plus, Trash2, Download, Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function DatabasePage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/get-firestore-data', {
          headers: {
            'x-user-id': user.uid,
          }
        });
        const data = await response.json();
        setCollections(data.collections);
      } catch (error) {
        console.error('Error fetching Firestore data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Firestore Explorer</h1>
        <p className="text-muted-foreground italic">Visualisez, modifiez et gérez votre base de données en temps réel.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-pink-500" />
                <CardTitle>Collections</CardTitle>
              </div>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Nouvelle collection</Button>
            </div>
            <CardDescription>Navigateur de collections Firestore</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : collections ? (
              <div className="space-y-2">
                {Object.entries(collections).map(([key, col]: [string, any]) => (
                  <div key={key}>
                    <button
                      onClick={() => setExpandedCollection(expandedCollection === key ? null : key)}
                      className="w-full p-3 rounded-md border border-white/5 bg-white/2 cursor-pointer hover:bg-white/5 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{col.name}</p>
                        <Badge variant="outline">{col.count} documents</Badge>
                      </div>
                    </button>
                    
                    {expandedCollection === key && col.data && col.data.length > 0 && (
                      <div className="mt-2 ml-4 space-y-2 border-l border-white/10 pl-4">
                        {col.data.map((doc: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-md bg-zinc-900/50 border border-white/5 text-xs">
                            <p className="font-mono text-muted-foreground">
                              <span className="text-blue-400">{doc.id}</span>
                            </p>
                            <pre className="mt-2 text-[10px] text-muted-foreground overflow-auto max-h-32">
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
              <p className="text-sm text-muted-foreground">Aucune donnée trouvée</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Outils de gestion</CardTitle>
            <CardDescription>Sauvegardez, restaurez et exportez votre base</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importer
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Sauvegarder
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Stockage utilisé</CardTitle>
            <CardDescription>Vue détaillée de votre utilisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Données stockées</span>
                <span className="font-semibold">234 MB / 5 GB</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "4.7%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
