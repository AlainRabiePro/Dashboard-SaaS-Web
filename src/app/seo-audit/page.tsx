'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search, CheckCircle2, AlertTriangle, Info, TrendingUp, Zap,
  FileText, Eye, Images, Lock, Code2, Smartphone
} from 'lucide-react';

interface AuditResult {
  score: number;
  url: string;
  title: string;
  description: string;
  issues: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    suggestion: string;
    impact: string;
  }>;
  metrics: {
    titleLength: number;
    descriptionLength: number;
    h1Count: number;
    h2Count: number;
    imagesWithoutAlt: number;
    totalImages: number;
    hasSSL: boolean;
    hasMetaViewport: boolean;
    hasStructuredData: boolean;
  };
}

export default function SEOAuditPage() {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer une URL valide',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        toast({
          title: 'Audit complété!',
          description: `Score SEO: ${data.score}/100`,
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Impossible d\'auditer ce site',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur s\'est produite',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-500/10 to-emerald-500/10 border-green-500/20';
    if (score >= 60) return 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20';
    if (score >= 40) return 'from-orange-500/10 to-red-500/10 border-orange-500/20';
    return 'from-red-500/10 to-red-500/10 border-red-500/20';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Audit SEO Gratuit</h1>
        <p className="text-slate-300">Analysez votre site et obtenez des suggestions d'optimisation</p>
      </div>

      {/* Input Form */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-400" />
            Analyser un Site
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAudit} className="space-y-4">
            <div>
              <Label htmlFor="url" className="text-white mb-2 block">URL à analyser</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  placeholder="https://exemple.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-slate-800/50 border-slate-700/50"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                >
                  {loading ? 'Audit...' : 'Auditer'}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">Entrez l'URL complète: https://votresite.com</p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Score Card */}
          <Card className={`bg-gradient-to-br ${getScoreBgColor(result.score)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Score SEO</CardTitle>
                  <CardDescription>{result.url}</CardDescription>
                </div>
                <div className="text-right">
                  <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score}
                  </div>
                  <p className="text-sm text-slate-400">sur 100</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    result.score >= 80 ? 'bg-green-500' :
                    result.score >= 60 ? 'bg-yellow-500' :
                    result.score >= 40 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${result.score}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Titre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white mb-2">{result.title || '(vide)'}</p>
                <p className="text-xs text-slate-400">
                  {result.metrics.titleLength} caractères (idéal: 30-60)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-cyan-400" />
                  Meta Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white mb-2 line-clamp-2">{result.description || '(vide)'}</p>
                <p className="text-xs text-slate-400">
                  {result.metrics.descriptionLength} caractères (idéal: 120-160)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Grid */}
          <div className="grid md:grid-cols-6 gap-3">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-white">{result.metrics.h1Count}</p>
                <p className="text-xs text-slate-400">H1</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-white">{result.metrics.h2Count}</p>
                <p className="text-xs text-slate-400">H2</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-white">{result.metrics.totalImages}</p>
                <p className="text-xs text-slate-400">Images</p>
              </CardContent>
            </Card>

            <Card className={`${result.metrics.hasSSL ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{result.metrics.hasSSL ? '✓' : '✗'}</p>
                <p className="text-xs text-slate-400">SSL</p>
              </CardContent>
            </Card>

            <Card className={`${result.metrics.hasMetaViewport ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{result.metrics.hasMetaViewport ? '✓' : '✗'}</p>
                <p className="text-xs text-slate-400">Mobile</p>
              </CardContent>
            </Card>

            <Card className={`${result.metrics.hasStructuredData ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{result.metrics.hasStructuredData ? '✓' : '–'}</p>
                <p className="text-xs text-slate-400">Schema</p>
              </CardContent>
            </Card>
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Problèmes Détectés ({result.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      issue.type === 'critical'
                        ? 'bg-red-500/10 border-red-500/30'
                        : issue.type === 'warning'
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div>
                        {issue.type === 'critical' && (
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        )}
                        {issue.type === 'warning' && (
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        )}
                        {issue.type === 'info' && (
                          <Info className="h-5 w-5 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">{issue.title}</h3>
                        <p className="text-sm text-slate-300 mb-2">{issue.description}</p>
                        
                        <div className="bg-slate-900/50 p-3 rounded mb-2 border-l-2 border-blue-500">
                          <p className="text-xs text-slate-400 mb-1 font-semibold">💡 Suggestion:</p>
                          <p className="text-sm text-slate-200">{issue.suggestion}</p>
                        </div>

                        <p className="text-xs text-slate-400">
                          📊 Impact: <span className="text-slate-300">{issue.impact}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.issues.length === 0 && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Excellent!</h3>
                <p className="text-slate-300">Aucun problème SEO majeur détecté 🎉</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info Section */}
      {!result && (
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Comment ça fonctionne?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 text-white">1</div>
                </div>
                <div>
                  <p className="font-semibold text-white">Entrez votre URL</p>
                  <p className="text-sm text-slate-400">https://exemple.com</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 text-white">2</div>
                </div>
                <div>
                  <p className="font-semibold text-white">Audit automatique</p>
                  <p className="text-sm text-slate-400">Scanne votre site en quelques secondes</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 text-white">3</div>
                </div>
                <div>
                  <p className="font-semibold text-white">Recevez les résultats</p>
                  <p className="text-sm text-slate-400">Score SEO détaillé avec suggestions</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 text-white">4</div>
                </div>
                <div>
                  <p className="font-semibold text-white">Optimisez votre site</p>
                  <p className="text-sm text-slate-400">Suivez les recommandations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
