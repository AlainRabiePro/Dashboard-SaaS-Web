"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestTube, Play, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface TestResult {
  id: string;
  name: string;
  status: string;
  duration: number;
  timestamp: string;
  error?: string;
}

interface TimelineItem {
  id: string;
  message: string;
  author: string;
  timestamp: string;
  tests: number;
  passed: number;
  failed: number;
}

export default function TestsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0, successRate: '0', totalDuration: 0, avgDuration: 0 });
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch('/api/tests', {
          headers: { 'x-user-id': user.uid }
        });
        const data = await response.json();
        setResults(data.results || []);
        setSummary(data.summary || {});
        setTimeline(data.timeline || []);
      } catch (error) {
        console.error('Error fetching test results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [user?.uid]);

  const getStatusBadge = (status: string) => {
    return status === 'passed' 
      ? <Badge className="bg-green-500/20 text-green-400">✓ {status}</Badge>
      : <Badge className="bg-red-500/20 text-red-400">✗ {status}</Badge>;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tests Automatisés</h1>
        <p className="text-muted-foreground italic">Executez et gérez vos tests unitaires, intégration et end-to-end.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-lime-500" />
                  <CardTitle>Suites de tests</CardTitle>
                </div>
                <Button size="sm" variant="outline"><Play className="h-4 w-4 mr-1" /> Lancer tous</Button>
              </div>
              <CardDescription>Exécutez vos pipelines de test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.slice(0, 3).map((result) => (
                <div key={result.id} className="p-4 rounded-md border border-white/5 bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{result.name}</p>
                    {getStatusBadge(result.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">Durée: {formatDuration(result.duration)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Rapport global</CardTitle>
              <CardDescription>Dernier run: {new Date().toLocaleString('fr-FR')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-md border border-white/5 bg-white/2">
                <p className="text-sm text-muted-foreground">Réussis</p>
                <p className="text-2xl font-bold text-green-400">{summary.passed}</p>
              </div>
              <div className="p-4 rounded-md border border-white/5 bg-white/2">
                <p className="text-sm text-muted-foreground">Échoués</p>
                <p className="text-2xl font-bold text-red-400">{summary.failed}</p>
              </div>
              <div className="p-4 rounded-md border border-white/5 bg-white/2">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-blue-400">{summary.total}</p>
              </div>
              <div className="p-4 rounded-md border border-white/5 bg-white/2">
                <p className="text-sm text-muted-foreground">Taux réussite</p>
                <p className="text-2xl font-bold text-blue-400">{summary.successRate}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Historique des commits</CardTitle>
              <CardDescription>Résultats des tests par déploiement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeline.map((item) => (
                <div key={item.id} className="p-4 rounded-md border border-white/5 bg-white/2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{item.message}</p>
                      <p className="text-xs text-muted-foreground">{item.author}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-500/20 text-green-400">{item.passed} ✓</Badge>
                      {item.failed > 0 && <Badge className="bg-red-500/20 text-red-400">{item.failed} ✗</Badge>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString('fr-FR')}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
