import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Trash2, Copy, Download, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard-utils';
import type { DatabaseType } from '@/lib/database-types';

interface QueryEditorProps {
  databaseType: DatabaseType;
  databaseConfig: any;
  siteId: string;
  databaseId: string;
}

interface QueryResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  columns?: string[];
  executionTime?: number;
  error?: string;
}

interface QueryHistory {
  id: string;
  query: string;
  executedAt: Date;
  executionTime?: number;
  rowCount?: number;
}

export function QueryEditor({
  databaseType,
  databaseConfig,
  siteId,
  databaseId,
}: QueryEditorProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Détecter si on est côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Charger l'historique depuis le localStorage
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(`query-history-${siteId}-${databaseId}`);
      if (saved) {
        setHistory(JSON.parse(saved).map((item: any) => ({
          ...item,
          executedAt: new Date(item.executedAt),
        })));
      }
    } catch (e) {
      console.error('Error loading history:', e);
    }
  }, [siteId, databaseId, isClient]);

  // Sauvegarder l'historique
  useEffect(() => {
    if (!isClient || typeof window === 'undefined' || history.length === 0) return;
    
    try {
      localStorage.setItem(
        `query-history-${siteId}-${databaseId}`,
        JSON.stringify(history)
      );
    } catch (e) {
      console.error('Error saving history:', e);
    }
  }, [history, siteId, databaseId, isClient]);

  const getPlaceholder = () => {
    switch (databaseType) {
      case 'firestore':
        return 'db.collection("users").where("age", ">", 18).limit(10)';
      case 'supabase':
      case 'postgresql':
      case 'mysql':
      case 'mariadb':
        return 'SELECT * FROM users WHERE age > 18 LIMIT 10;';
      case 'mongodb':
        return 'db.collection("users").find({ age: { $gt: 18 } }).limit(10)';
      default:
        return 'Entrez votre requête...';
    }
  };

  const handleExecute = async () => {
    if (!query.trim()) {
      setResult({
        success: false,
        error: 'Veuillez entrer une requête',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/execute-database-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          databaseId,
          type: databaseType,
          config: databaseConfig,
          query: query.trim(),
        }),
      });

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      setResult({
        ...data,
        executionTime,
      });

      // Ajouter à l'historique si succès
      if (data.success) {
        const newHistoryItem: QueryHistory = {
          id: Date.now().toString(),
          query: query.trim(),
          executedAt: new Date(),
          executionTime,
          rowCount: data.rowCount,
        };
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 50)); // Garder les 50 dernières
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Erreur lors de l\'exécution',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromHistory = (historyItem: QueryHistory) => {
    setQuery(historyItem.query);
    setSelectedHistoryId(historyItem.id);
  };

  const handleCopyQuery = async () => {
    const success = await copyToClipboard(query, 
      () => {
        // Succès silencieux
      },
      (error) => {
        console.error('Copy failed:', error);
      }
    );
    if (!success) {
      // Notification d'erreur
      console.warn('Could not copy to clipboard');
    }
  };

  const handleExportResults = () => {
    if (!result?.data) return;

    const csv = convertToCSV(result.data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${new Date().toISOString()}.csv`;
    a.click();
  };

  const handleClearHistory = () => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`query-history-${siteId}-${databaseId}`);
      } catch (e) {
        console.error('Error clearing history:', e);
      }
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Editor Section */}
      <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Query Editor</CardTitle>
          <CardDescription>Écrivez et exécutez des requêtes sur votre base de données</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Textarea */}
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full h-48 p-4 rounded-lg bg-zinc-900 border border-white/10 text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleExecute}
              disabled={loading || !query.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exécution...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Exécuter
                </>
              )}
            </Button>

            <Button
              onClick={handleCopyQuery}
              disabled={!query.trim()}
              variant="outline"
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copier
            </Button>

            <Button
              onClick={handleExportResults}
              disabled={!result?.data || result.data.length === 0}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>

            <Button
              onClick={() => setQuery('')}
              variant="outline"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Effacer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <CardTitle>
                  {result.success ? 'Résultats' : 'Erreur'}
                </CardTitle>
              </div>
              {result.executionTime && (
                <span className="text-xs text-muted-foreground">
                  Exécution: {result.executionTime}ms
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success && result.data ? (
              <>
                {result.data.length > 0 ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      {result.rowCount} ligne(s) retournée(s)
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto border border-white/10 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-900">
                          <tr>
                            {result.columns?.map(col => (
                              <th key={col} className="px-4 py-2 text-left font-semibold text-xs text-muted-foreground border-b border-white/5">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.data!.slice(0, 100).map((row, idx) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/2">
                              {result.columns?.map(col => (
                                <td key={col} className="px-4 py-2">
                                  <code className="text-xs bg-zinc-900/50 px-2 py-1 rounded text-muted-foreground">
                                    {formatValue(row[col])}
                                  </code>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {result.data.length > 100 && (
                      <div className="text-xs text-muted-foreground">
                        Affichage des 100 premières lignes sur {result.data.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Aucun résultat</div>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Historique ({history.length})</CardTitle>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map(item => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedHistoryId === item.id
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-white/5 bg-white/2 hover:bg-white/5'
                  }`}
                  onClick={() => handleLoadFromHistory(item)}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-mono text-xs text-muted-foreground truncate flex-1">
                      {item.query.substring(0, 100)}
                      {item.query.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 ml-2">
                      {item.executionTime && (
                        <Badge variant="outline" className="text-xs">
                          {item.executionTime}ms
                        </Badge>
                      )}
                      {item.rowCount !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {item.rowCount} lignes
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.executedAt.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clear History Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Effacer l'historique</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous certain de vouloir effacer tout l'historique des requêtes?
          </AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              className="bg-red-500 hover:bg-red-600"
            >
              Effacer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Formate une valeur pour l'affichage
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value).substring(0, 50);
  }
  return String(value).substring(0, 100);
}

/**
 * Convertit les données en CSV
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    ),
  ].join('\n');

  return csv;
}
