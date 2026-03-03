"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, Eye, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface AnalyticData {
  date: string;
  views: number;
  users: number;
  avgSessionDuration: number;
  bounceRate: string;
}

interface TopPage {
  path: string;
  views: number;
}

interface Referrer {
  source: string;
  users: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticData[]>([]);
  const [summary, setSummary] = useState({ totalViews: 0, totalUsers: 0, avgSessionDuration: 0, avgBounceRate: 0 });
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
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
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm">Vues de page</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-400">{summary.totalViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Derniers 7 jours</p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm">Visiteurs uniques</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-400">{summary.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Utilisateurs</p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-sm">Session moyenne</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-400">{formatDuration(summary.avgSessionDuration)}</p>
                <p className="text-xs text-muted-foreground mt-1">Durée moyenne</p>
              </CardContent>
            </Card>

            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm">Taux de rebond</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">{summary.avgBounceRate?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Moyenne</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Meilleures pages</CardTitle>
                <CardDescription>Pages les plus visitées</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPages.map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
                    <span className="text-sm font-mono">{page.path}</span>
                    <Badge className="bg-blue-500/20 text-blue-400">{page.views.toLocaleString()} vues</Badge>
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
                  <div key={idx} className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
                    <span className="text-sm capitalize font-semibold">{ref.source}</span>
                    <Badge className="bg-green-500/20 text-green-400">{ref.users.toLocaleString()} users</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Trafic par jour</CardTitle>
              <CardDescription>Évolution des visites sur 7 jours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.map((data, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-white/2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{data.date}</p>
                    <p className="text-xs text-muted-foreground">{data.users} visiteurs</p>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <p className="text-sm font-bold text-blue-400">{data.views}</p>
                      <p className="text-xs text-muted-foreground">vues</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-400">{data.bounceRate}%</p>
                      <p className="text-xs text-muted-foreground">rebond</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
