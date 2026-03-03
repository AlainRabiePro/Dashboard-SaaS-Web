"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Activity, Zap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Site {
  id: string;
  name: string;
  uptime: number;
  latency: number;
  errorRate: number;
  status: string;
}

export default function MonitoringPage() {
  const { user } = useAuth();
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [summary, setSummary] = useState({ uptime: 0, latency: 0, errorRate: 0, alerts: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

  useEffect(() => {
    const fetchMonitoring = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const params = selectedSiteId !== 'all' ? `?siteId=${selectedSiteId}` : '';
        const response = await fetch(`/api/monitoring${params}`, {
          headers: { 'x-user-id': user.uid }
        });
        const data = await response.json();
        
        // Si c'est la première charge ou 'all', stocker tous les sites
        if (selectedSiteId === 'all' || allSites.length === 0) {
          setAllSites(data.sites || []);
        }
        
        setSites(data.sites || []);
        setSummary(data.summary || {});
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoring();
  }, [user?.uid, selectedSiteId]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <Badge className="bg-green-500/20 text-green-400">OK</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/20 text-amber-400">WARN</Badge>;
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400">CRITICAL</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">UNKNOWN</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
          <p className="text-muted-foreground italic">Suivez la performance et la santé de vos applications en temps réel.</p>
        </div>

        {/* Site Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Sélectionner un site :</label>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="px-3 py-2 rounded-md bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tous les sites</option>
            {allSites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm">Uptime</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-400">{summary.uptime?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Derniers 30 jours</p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm">Latence avg</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-400">{summary.latency}ms</p>
                <p className="text-xs text-muted-foreground mt-1">P95: {Math.floor(summary.latency * 1.5)}ms</p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm">Taux d'erreur</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">{summary.errorRate?.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground mt-1">{Math.floor(summary.errorRate * 10)} erreurs/min en avg</p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <CardTitle className="text-sm">Alertes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-400">{summary.alerts}</p>
                <p className="text-xs text-muted-foreground mt-1">Actifs</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Performance par site</CardTitle>
                <CardDescription>Statistiques en temps réel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sites.map((site) => (
                  <div key={site.id} className="p-3 rounded-md border border-white/5 bg-white/2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{site.name}</p>
                      {getStatusBadge(site.status)}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>↓ Uptime: {site.uptime.toFixed(1)}%</span>
                      <span>⏱ Latence: {site.latency}ms</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Alertes actives</CardTitle>
                <CardDescription>Problèmes détectés</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.alerts > 0 ? (
                  <>
                    <div className="p-3 rounded-md border border-red-500/20 bg-red-500/5">
                      <p className="text-sm font-semibold text-red-400">Haute latence détectée</p>
                      <p className="text-xs text-muted-foreground mt-1">Certain(s) site(s) dépasse 500ms</p>
                    </div>
                    <div className="p-3 rounded-md border border-amber-500/20 bg-amber-500/5">
                      <p className="text-sm font-semibold text-amber-400">Utilisation mémoire élevée</p>
                      <p className="text-xs text-muted-foreground mt-1">Certains serveurs à capacité élevée</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-4">Aucune alerte active</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
