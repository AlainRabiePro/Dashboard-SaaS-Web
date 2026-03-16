'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { copyToClipboard } from '@/lib/clipboard-utils';
import { 
  ShoppingCart, Percent, TrendingUp, Users, DollarSign, 
  Copy, CheckCircle2, AlertCircle, Globe, Target, Zap, BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface ResellerProfile {
  id: string;
  userId: string;
  status: 'pending' | 'active' | 'inactive';
  commissionRate: number;
  totalSales: number;
  totalRevenue: number;
  affiliateLink: string;
  createdAt: string;
}

interface ResellingSales {
  domain: string;
  price: number;
  commission: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export default function ResellerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [sales, setSales] = useState<ResellingSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      router.push('/login');
      return;
    }
    fetchResellerData();
  }, [user?.uid]);

  const fetchResellerData = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch('/api/reseller/profile', {
        headers: {
          'x-user-id': user.uid,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setSales(data.sales || []);
      } else if (response.status === 404) {
        // Créer un nouveau profil revendeur
        await createResellerProfile();
      }
    } catch (error) {
      console.error('Error fetching reseller data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos données de revendeur',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createResellerProfile = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch('/api/reseller/profile', {
        method: 'POST',
        headers: {
          'x-user-id': user.uid,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        toast({
          title: 'Succès',
          description: 'Profil revendeur créé avec succès!',
        });
      }
    } catch (error) {
      console.error('Error creating reseller profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAffiliateLink = async () => {
    if (profile?.affiliateLink) {
      const success = await copyToClipboard(profile.affiliateLink);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: 'Copié!',
          description: 'Lien affilié copié dans le presse-papiers',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de copier le lien',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">Impossible de charger votre profil revendeur.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedSales = sales.filter(s => s.status === 'completed');
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.commission, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard Revendeur</h1>
          <p className="text-slate-300">Gagnez de l'argent en revendent nos domaines</p>
        </div>
        <Link href="/dashboard/reseller/analytics">
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Voir Analytics
          </Button>
        </Link>
      </div>

      {/* Status Card */}
      <Card className={`bg-gradient-to-br ${
        profile.status === 'active' 
          ? 'from-green-500/10 to-emerald-500/10 border-green-500/20' 
          : 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Compte Revendeur</CardTitle>
              <CardDescription>
                Status: <span className={`font-bold ${profile.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {profile.status === 'active' ? '✅ Actif' : '⏳ En attente'}
                </span>
              </CardDescription>
            </div>
            <Globe className={`h-8 w-8 ${profile.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`} />
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">Domaines Vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{completedSales.length}</div>
            <p className="text-xs text-slate-400 mt-1">Transactions complétées</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">Revenu Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">€{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-slate-400 mt-1">Commission gagnée</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400">{profile.commissionRate}%</div>
            <p className="text-xs text-slate-400 mt-1">Par domaine vendu</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-300">Revenu Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-400">
              €{completedSales.length > 0 ? (totalRevenue / completedSales.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-slate-400 mt-1">Par vente</p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Link Section */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            Votre Lien Affilié
          </CardTitle>
          <CardDescription>Partagez ce lien pour générer des commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={profile.affiliateLink}
              readOnly
              className="bg-slate-800/50 border-slate-700/50"
            />
            <Button
              onClick={copyAffiliateLink}
              variant="outline"
              className={`transition ${
                copied ? 'bg-green-500 border-green-500' : ''
              }`}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Quand un client utilise votre lien, vous recevez {profile.commissionRate}% sur chaque domaine acheté
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-400" />
            Comment ça fonctionne?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white font-bold">1</div>
              </div>
              <div>
                <p className="font-medium text-white">Partagez votre lien</p>
                <p className="text-sm text-slate-400">Envoyez votre lien affilié à vos contacts, clients ou réseaux</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white font-bold">2</div>
              </div>
              <div>
                <p className="font-medium text-white">Client clique et achète</p>
                <p className="text-sm text-slate-400">Un client achète un domaine via votre lien</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white font-bold">3</div>
              </div>
              <div>
                <p className="font-medium text-white">Recevez votre commission</p>
                <p className="text-sm text-slate-400">{profile.commissionRate}% de commission automatiquement crédité</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Examples */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            Potentiel de Revenus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-2">10 domaines/mois</p>
              <p className="text-2xl font-bold text-white">€150 - €200</p>
              <p className="text-xs text-slate-400 mt-2">à {profile.commissionRate}% de commission</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-2">50 domaines/mois</p>
              <p className="text-2xl font-bold text-white">€750 - €1000</p>
              <p className="text-xs text-slate-400 mt-2">à {profile.commissionRate}% de commission</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-2">100+ domaines/mois</p>
              <p className="text-2xl font-bold text-white">€1500+</p>
              <p className="text-xs text-slate-400 mt-2">à {profile.commissionRate}% de commission</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-400" />
            Ventes Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">Aucune vente pour le moment</p>
              <p className="text-sm text-slate-500 mb-6">Commencez à partager votre lien affilié!</p>
              <Button asChild>
                <Link href="/">Aller à l'accueil</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700/50">
                  <tr>
                    <th className="text-left py-3 text-slate-400">Domaine</th>
                    <th className="text-left py-3 text-slate-400">Prix</th>
                    <th className="text-left py-3 text-slate-400">Commission</th>
                    <th className="text-left py-3 text-slate-400">Date</th>
                    <th className="text-left py-3 text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {sales.map((sale, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 text-white font-medium">{sale.domain}</td>
                      <td className="py-3 text-slate-300">€{sale.price.toFixed(2)}</td>
                      <td className="py-3 text-green-400 font-medium">€{sale.commission.toFixed(2)}</td>
                      <td className="py-3 text-slate-400">{new Date(sale.date).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          sale.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          sale.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {sale.status === 'completed' ? '✓ Complété' :
                           sale.status === 'pending' ? '⏳ En attente' :
                           '✗ Annulé'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marketing Resources */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Ressources Marketing
          </CardTitle>
          <CardDescription>Outils pour promouvoir votre lien affilié</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="font-medium text-white mb-2">Email Template</p>
            <p className="text-sm text-slate-400 mb-3">
              Utilisez ce modèle pour promouvoir votre lien par email
            </p>
            <Button variant="outline" size="sm">
              Télécharger Template
            </Button>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="font-medium text-white mb-2">Social Media Posts</p>
            <p className="text-sm text-slate-400 mb-3">
              Posts prêts à partager sur vos réseaux sociaux
            </p>
            <Button variant="outline" size="sm">
              Voir Templates
            </Button>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="font-medium text-white mb-2">Documentation</p>
            <p className="text-sm text-slate-400 mb-3">
              Guide complet pour devenir revendeur DomainHub
            </p>
            <Button variant="outline" size="sm">
              Lire la Doc
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
