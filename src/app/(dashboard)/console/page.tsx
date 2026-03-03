"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Zap, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source: string;
}

export default function ConsolePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState({ total: 0, errors: 0, warnings: 0, lastError: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch('/api/console', {
          headers: { 'x-user-id': user.uid }
        });
        const data = await response.json();
        setLogs(data.logs || []);
        setSummary(data.summary || {});
      } catch (error) {
        console.error('Error fetching console logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user?.uid]);

  const getLogColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-amber-400';
      case 'info': return 'text-green-400';
      case 'debug': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getLevelBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-500/10';
    if (statusCode >= 300 && statusCode < 400) return 'bg-blue-500/10';
    if (statusCode >= 400 && statusCode < 500) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Console de Debug</h1>
        <p className="text-muted-foreground italic">Inspectez les logs, erreurs et requêtes réseau en temps réel.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Logs en direct</CardTitle>
              </div>
              <CardDescription>Suivez en temps réel tous les événements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-md p-4 font-mono text-sm space-y-1 max-h-48 overflow-y-auto">
                {logs.slice(0, 10).map((log, idx) => (
                  <div key={idx} className={getLogColor(log.level)}>
                    [{log.level.toUpperCase()}] {log.message}
                  </div>
                ))}
                {logs.length === 0 && <div className="text-gray-400">Aucun log disponible</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg">Requêtes API</CardTitle>
              </div>
              <CardDescription>Inspectez les appels réseau</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{log.message.substring(0, 25)}...</span>
                    <Badge variant="outline" className={getLevelBadge(200)}>
                      {log.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Erreurs</CardTitle>
              </div>
              <CardDescription>{summary.errors} erreurs détectées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {summary.errors > 0 ? (
                  <>
                    <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                      <p className="font-mono text-red-400">Erreurs détectées</p>
                    </div>
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                      <p className="font-mono text-amber-400">Warnings: {summary.warnings}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-4">Aucune erreur</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
