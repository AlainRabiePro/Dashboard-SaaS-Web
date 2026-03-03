"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, Eye, Loader2, Smartphone, Monitor, Tablet } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface AnalyticData {
  date: string;
  views: number;
  users: number;
  avgSessionDuration: number;
  bounceRate: string;
  conversionRate: string;
}

interface TopPage {
  path: string;
  views: number;
  bounceRate: string;
}

interface Referrer {
  source: string;
  users: number;
  percentage: number;
}

interface Device {
  device: string;
  users: number;
  percentage: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticData[]>([]);
  const [summary, setSummary] = useState({ 
    totalViews: 0, 
    totalUsers: 0, 
    avgSessionDuration: 0, 
    avgBounceRate: 0,
    avgConversionRate: 0,
  });
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch('/api/analytics', {
          headers: { 'x-user-id': user.uid }
        });
        const data = await response.json();
        setAnalytics(data.analytics || []);
        setSummary(data.summary || {});
        setTopPages(data.topPages || []);
        setReferrers(data.referrers || []);
        setDevices(data.devices || []);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user?.uid]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getDeviceIcon = (device: string) => {
    switch(device.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytique</h1>
        <p className="text-muted-foreground italic">Analysez le trafic, les conversions et le comportement des visiteurs.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-xs uppercase text-muted-foreground">Vues</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-400">{(summary.totalViews / 1000).toFixed(1)}k</p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-xs uppercase text-muted-foreground">Visiteurs</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-400">{(summary.totalUsers / 1000).toFixed(1)}k</p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-xs uppercase text-muted-foreground">Session</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-400">{formatDuration(summary.avgSessionDuration)}</p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-xs uppercase text-muted-foreground">Rebond</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">{summary.avgBounceRate?.toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-rose-500" />
                  <CardTitle className="text-xs uppercase text-muted-foreground">Conversion</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-rose-400">{summary.avgConversionRate}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm md:col-span-2">
              <CardHeader>
                <CardTitle>Trafic par jour (30 jours)</CardTitle>
                <CardDescription>Évolution des visites</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.slice(-7).map((data, idx) => (
                    <div key={idx} className="flex items-center Gap-2">
                      <div className="w-24 text-sm text-muted-foreground">{data.date}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-zinc-800 rounded h-6 relative overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded transition-all"
                            style={{ width: `${Math.min((data.views / 800) * 100, 100)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-lighten">
                            {data.views}
                          </span>
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm font-semibold text-blue-400">{data.users} users</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Appareils</CardTitle>
                <CardDescription>Répartition par device</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {devices.map((device, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.device)}
                        <span className="text-sm font-semibold">{device.device}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-400">{device.percentage}%</span>
                    </div>
                    <div className="bg-zinc-800 rounded h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded transition-all"
                        style={{ width: `${device.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Top 5 pages</CardTitle>
                <CardDescription>Les pages les plus visitées</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPages.map((page, idx) => (
                  <div key={idx} className="p-3 rounded-md border border-white/5 bg-white/2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono font-semibold truncate">{page.path}</span>
                      <Badge className="bg-blue-500/20 text-blue-400 ml-2">{page.views} vues</Badge>
                    </div>
                    <div className="bg-zinc-800 rounded h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full"
                        style={{ width: `${Math.min((page.views / 2500) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Bounce: {page.bounceRate}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Sources de trafic</CardTitle>
                <CardDescription>D'où viennent les visiteurs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {referrers.map((ref, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold capitalize">{ref.source}</span>
                      <Badge className="bg-green-500/20 text-green-400">{ref.percentage}%</Badge>
                    </div>
                    <div className="bg-zinc-800 rounded h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-full"
                        style={{ width: `${ref.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{ref.users.toLocaleString()} users</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
