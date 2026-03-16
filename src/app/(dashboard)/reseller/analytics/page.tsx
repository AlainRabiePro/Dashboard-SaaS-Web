'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Mouse, Target, DollarSign, BarChart3, PieChart as PieChartIcon,
  Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Analytics {
  period: string;
  metrics: {
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    totalRevenue: number;
    avgRevenuePerSale: number;
  };
  chartData: any[];
  trafficSources: any[];
  domainExtensions: any[];
  topDays: any[];
}

const COLORS = ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AffiliateAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');
  const [previousMetrics, setPreviousMetrics] = useState<any>(null);

  useEffect(() => {
    if (!user?.uid) {
      router.push('/login');
      return;
    }
    fetchAnalytics();
  }, [user?.uid, period]);

  const fetchAnalytics = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/reseller/analytics?period=${period}`, {
        headers: {
          'x-user-id': user.uid,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les analytics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="bg-red-500/10 border-red-500/20 max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">Impossible de charger vos analytics.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics, chartData, trafficSources, domainExtensions, topDays } = analytics;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Analytics Affilié</h1>
          <p className="text-slate-300">Suivez en temps réel vos clics et conversions</p>
        </div>
        <div className="flex gap-2">
          {['7', '30', '90'].map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
              className="text-sm"
            >
              {p === '7' ? '7j' : p === '30' ? '30j' : '90j'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Mouse className="h-4 w-4" />
              Clics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{metrics.totalClicks}</div>
            <p className="text-xs text-slate-400 mt-1">Visiteurs uniques</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{metrics.totalConversions}</div>
            <p className="text-xs text-slate-400 mt-1">Domaines vendus</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taux Conv.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-400">{metrics.conversionRate}%</div>
            <p className="text-xs text-slate-400 mt-1">Clic → Achat</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">€{metrics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-slate-400 mt-1">Commission gagnée</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Revenu/Vente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400">€{metrics.avgRevenuePerSale.toFixed(2)}</div>
            <p className="text-xs text-slate-400 mt-1">Moyenne par conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ligne Chart - Clics vs Conversions */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Clics & Conversions
            </CardTitle>
            <CardDescription>Tendance sur {period === '7' ? '7 jours' : period === '30' ? '30 jours' : '90 jours'}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="clicks" stroke="#0ea5e9" strokeWidth={2} name="Clics" />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Revenus Journaliers
            </CardTitle>
            <CardDescription>Commissions gagnées chaque jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" name="Revenus (€)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources & Domain Extensions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-cyan-400" />
              Sources de Trafic
            </CardTitle>
            <CardDescription>D'où viennent vos clics?</CardDescription>
          </CardHeader>
          <CardContent>
            {trafficSources.length > 0 ? (
              <div className="space-y-4">
                {trafficSources.map((source, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                    <div>
                      <p className="font-medium text-white">{source.source}</p>
                      <p className="text-sm text-slate-400">{source.count} clics</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-400">{source.percentage}%</p>
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{ width: `${source.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">Aucune donnée de trafic</p>
            )}
          </CardContent>
        </Card>

        {/* Domain Extensions */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-green-400" />
              Domaines Populaires
            </CardTitle>
            <CardDescription>Quels TLDs se vendent le plus?</CardDescription>
          </CardHeader>
          <CardContent>
            {domainExtensions.length > 0 ? (
              <div className="space-y-4">
                {domainExtensions.map((domain, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                    <div>
                      <p className="font-medium text-white">{domain.extension}</p>
                      <p className="text-sm text-slate-400">{domain.count} ventes</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">{domain.percentage}%</p>
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${domain.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">Aucune vente encore</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Days */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-400" />
            Meilleures Journées
          </CardTitle>
          <CardDescription>Vos jours les plus performants</CardDescription>
        </CardHeader>
        <CardContent>
          {topDays.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700/50">
                  <tr>
                    <th className="text-left py-3 text-slate-400">Date</th>
                    <th className="text-left py-3 text-slate-400">Clics</th>
                    <th className="text-left py-3 text-slate-400">Conversions</th>
                    <th className="text-left py-3 text-slate-400">Taux</th>
                    <th className="text-right py-3 text-slate-400">Revenu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {topDays.map((day, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 text-white">{day.date}</td>
                      <td className="py-3 text-slate-300">{day.clicks}</td>
                      <td className="py-3 text-green-400 font-medium">{day.conversions}</td>
                      <td className="py-3 text-orange-400">{((day.conversions / (day.clicks || 1)) * 100).toFixed(1)}%</td>
                      <td className="py-3 text-right font-bold text-purple-400">€{day.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">Aucune donnée disponible</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
