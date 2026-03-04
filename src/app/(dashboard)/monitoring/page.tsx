"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Activity, Zap, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Site {
  id: string;
  name: string;
  domain: string;
  uptime: number;
  latency: number;
  errorRate: number;
  status: string;
  lastCheck: number | null;
}

export default function MonitoringPage() {
  const { user } = useAuth();
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [summary, setSummary] = useState({ uptime: 0, latency: 0, errorRate: 0, alerts: 0 });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [checkMessage, setCheckMessage] = useState<string>('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Récupérer les alertes
  const fetchAlerts = async () => {
    if (!user?.uid) return;
    try {
      setLoadingAlerts(true);
      const params = selectedSiteId !== 'all' ? `?siteId=${selectedSiteId}` : '';
      const response = await fetch(`/api/alerts${params}`, {
        headers: { 'x-user-id': user.uid }
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Charger les alertes au démarrage
  useEffect(() => {
    fetchAlerts();
  }, [user?.uid, selectedSiteId]);

  // Marquer une alerte comme résolue
  const resolveAlert = async (siteId: string, alertId: string) => {
    if (!user?.uid) return;
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: {
          'x-user-id': user.uid,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId, alertId }),
      });

      if (response.ok) {
        // Re-charger les alertes
        await fetchAlerts();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  // Récupérer les données de monitoring
  const fetchMonitoring = async () => {
    if (!user?.uid) return;
    try {
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
      
      return data.sites || [];
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      return [];
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const sites = await fetchMonitoring();
        
        // Si aucune donnée de monitoring, déclencher un health check automatiquement
        const hasMetrics = sites.some(
          (site: any) => site.uptime > 0 || site.latency > 0
        );
        if (!hasMetrics && sites.length > 0) {
          // Attendre 1 seconde puis déclencher le check
          setTimeout(async () => {
            try {
              setChecking(true);
              const response = await fetch('/api/health-check', {
                method: 'POST',
                headers: { 'x-user-id': user.uid }
              });
              if (response.ok) {
                // Re-charger les données après le check
                await fetchMonitoring();
                await fetchAlerts();
              }
            } catch (error) {
              console.error('Error triggering auto health check:', error);
            } finally {
              setChecking(false);
            }
          }, 1000);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.uid, selectedSiteId]);

  // Déclencher un health check
  const handleHealthCheck = async () => {
    if (!user?.uid) return;
    try {
      setChecking(true);
      setCheckMessage('');
      
      const response = await fetch('/api/health-check', {
        method: 'POST',
        headers: { 'x-user-id': user.uid }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLastCheckTime(new Date().toLocaleTimeString('fr-FR'));
        setCheckMessage(`✓ ${data.checked} site(s) vérifié(s) avec succès`);
        
        // Re-charger les données de monitoring et les alertes
        await fetchMonitoring();
        await fetchAlerts();
        
        // Masquer le message après 5 secondes
        setTimeout(() => setCheckMessage(''), 5000);
      } else {
        setCheckMessage('✗ Erreur lors du health check');
        setTimeout(() => setCheckMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error triggering health check:', error);
      setCheckMessage('✗ Erreur lors du health check');
      setTimeout(() => setCheckMessage(''), 5000);
    } finally {
      setChecking(false);
    }
  };

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

        {/* Controls */}
        <div className="flex items-center justify-between">
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleHealthCheck}
              disabled={checking}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Lancer un health check
                </>
              )}
            </button>
          </div>
        </div>

        {/* Check Message */}
        {checkMessage && (
          <div className={`p-3 rounded-md text-sm ${
            checkMessage.startsWith('✓') 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {checkMessage}
            {lastCheckTime && <span className="text-xs text-muted-foreground ml-2">(à {lastCheckTime})</span>}
          </div>
        )}

        {lastCheckTime && !checkMessage && (
          <div className="text-xs text-muted-foreground">
            Dernier check réussi à {lastCheckTime}
          </div>
        )}
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
                <p className="text-2xl font-bold text-red-400">{alerts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Actives</p>
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
                <CardDescription>{alerts.length} alerte(s) détectée(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.length > 0 ? (
                  alerts.map((alert: any, idx: number) => {
                    const severity = alert.severity || 'warning';
                    const borderColor = severity === 'critical' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5';
                    const titleColor = severity === 'critical' ? 'text-red-400' : 'text-amber-400';

                    return (
                      <div key={idx} className={`p-3 rounded-md border ${borderColor} flex items-start justify-between gap-3`}>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${titleColor}`}>{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            // Find the siteId from the alert
                            const site = sites.find(s => 
                              alerts.find(a => a.documentId === alert.documentId)
                            ) || allSites[0];
                            if (site?.id) {
                              resolveAlert(site.id, alert.documentId);
                            }
                          }}
                          className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-muted-foreground hover:text-white transition-colors"
                        >
                          Résoudre
                        </button>
                      </div>
                    );
                  })
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
