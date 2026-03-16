"use client";

import { useAuth } from "@/context/AuthContext";
import { useFirestore } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  GitCommit,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Github,
  FileText
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Site, UserProfile } from "@/lib/firestore-service";
import { StatCard } from "@/components/dashboard/stat-card";
import { useTests } from "@/hooks/use-tests";
import { TestResultDialog } from "@/components/test-result-dialog";

interface TestSuite {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e';
  framework: string;
  lastRun?: {
    date: string;
    status: 'passed' | 'failed' | 'running';
    duration: number;
    passed: number;
    failed: number;
    total: number;
  };
  enabled: boolean;
}

interface TestRun {
  id: string;
  suiteId: string;
  date: string;
  status: 'passed' | 'failed' | 'running';
  duration: number;
  passed: number;
  failed: number;
  total: number;
  commitHash?: string;
  commitMessage?: string;
  deploymentId?: string;
}

const DEFAULT_TEST_SUITES: TestSuite[] = [
  {
    id: 'unit-tests',
    name: 'Tests Unitaires',
    type: 'unit',
    framework: 'Jest',
    enabled: true,
    lastRun: {
      date: '03/03/2026 16:55:13',
      status: 'passed',
      duration: 2450,
      passed: 145,
      failed: 0,
      total: 145,
    },
  },
  {
    id: 'integration-tests',
    name: 'Tests Intégration',
    type: 'integration',
    framework: 'Jest + Supertest',
    enabled: true,
    lastRun: {
      date: '03/03/2026 16:52:00',
      status: 'passed',
      duration: 5230,
      passed: 58,
      failed: 0,
      total: 58,
    },
  },
  {
    id: 'e2e-tests',
    name: 'Tests End-to-End',
    type: 'e2e',
    framework: 'Cypress',
    enabled: true,
    lastRun: {
      date: '03/03/2026 16:45:30',
      status: 'passed',
      duration: 8900,
      passed: 32,
      failed: 0,
      total: 32,
    },
  },
];

const MOCK_TEST_HISTORY: TestRun[] = [
  {
    id: '1',
    suiteId: 'unit-tests',
    date: '03/03/2026 16:55:13',
    status: 'passed',
    duration: 2450,
    passed: 145,
    failed: 0,
    total: 145,
    commitHash: 'a1b2c3d',
    commitMessage: 'Fix: Update authentication logic',
  },
  {
    id: '2',
    suiteId: 'integration-tests',
    date: '03/03/2026 16:52:00',
    status: 'passed',
    duration: 5230,
    passed: 58,
    failed: 0,
    total: 58,
    commitHash: 'a1b2c3d',
  },
  {
    id: '3',
    suiteId: 'e2e-tests',
    date: '03/03/2026 16:45:30',
    status: 'passed',
    duration: 8900,
    passed: 32,
    failed: 0,
    total: 32,
    commitHash: 'x9y8z7w',
    commitMessage: 'Feature: Add new dashboard components',
    deploymentId: 'deploy-001',
  },
  {
    id: '4',
    suiteId: 'unit-tests',
    date: '02/03/2026 14:20:45',
    status: 'failed',
    duration: 3100,
    passed: 142,
    failed: 3,
    total: 145,
    commitHash: 'p9q8r7s',
    commitMessage: 'WIP: Refactor components',
  },
];

export default function TestsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { results: testResults, loading: testsLoading, error: testsError, runTests, fetchGitHubResults, clearError } = useTests();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [testSuites, setTestSuites] = useState<TestSuite[]>(DEFAULT_TEST_SUITES);
  const [runningTests, setRunningTests] = useState<string[]>([]);
  const [isCreatingTestSuite, setIsCreatingTestSuite] = useState(false);
  const [gitHubConfig, setGitHubConfig] = useState({ owner: "", repo: "", token: "", workflow: "" });
  const [showGitHubDialog, setShowGitHubDialog] = useState(false);
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
  const [selectedTestResult, setSelectedTestResult] = useState<any>(null);
  const [showTestResultDialog, setShowTestResultDialog] = useState(false);
  const [isCreatingExamples, setIsCreatingExamples] = useState(false);

  // Récupérer le profil utilisateur
  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  // Récupérer les sites de l'utilisateur
  const sitesRef = useMemo(() => user ? collection(firestore, "users", user.uid, "sites") : null, [firestore, user]);
  const { data: sites, loading: sitesLoading } = useCollection<Site>(sitesRef);

  // Sélectionner automatiquement le premier site
  useEffect(() => {
    if (sites && sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  // Calculer les statistiques globales
  const stats = useMemo(() => {
    const lastRuns = testSuites
      .map(suite => suite.lastRun)
      .filter((run): run is TestSuite['lastRun'] => !!run);

    const totalPassed = lastRuns.reduce((sum, run) => sum + run.passed, 0);
    const totalFailed = lastRuns.reduce((sum, run) => sum + run.failed, 0);
    const total = lastRuns.reduce((sum, run) => sum + run.total, 0);
    const successRate = total > 0 ? Math.round((totalPassed / total) * 100) : 0;

    return {
      passed: totalPassed,
      failed: totalFailed,
      total,
      successRate,
      lastRunDate: lastRuns.length > 0 ? lastRuns[0].date : 'Jamais',
    };
  }, [testSuites]);

  // Exécuter une suite de tests
  const runTestSuite = useCallback(async (suiteId: string) => {
    if (!user || !selectedSiteId) return;
    
    setRunningTests(prev => [...prev, suiteId]);

    try {
      await runTests(selectedSiteId, suiteId, user.uid);
      
      // Mettre à jour la dernière exécution de la suite
      setTestSuites(prev => prev.map(suite => {
        if (suite.id !== suiteId) return suite;
        
        const result = testResults[0];
        if (!result) return suite;

        return {
          ...suite,
          lastRun: {
            date: result.date,
            status: result.status,
            duration: result.duration,
            passed: result.passed,
            failed: result.failed,
            total: result.total,
          },
        };
      }));
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setRunningTests(prev => prev.filter(id => id !== suiteId));
    }
  }, [user, selectedSiteId, runTests, testResults]);


  // Exécuter tous les tests
  const runAllTests = useCallback(async () => {
    const suitesToRun = testSuites.filter(s => s.enabled).map(s => s.id);
    setRunningTests(suitesToRun);

    // Exécuter séquentiellement
    for (const suiteId of suitesToRun) {
      await runTestSuite(suiteId);
    }

    setRunningTests([]);
  }, [testSuites, runTestSuite]);

  // Charger les résultats GitHub Actions
  const loadGitHubResults = useCallback(async () => {
    if (!gitHubConfig.owner || !gitHubConfig.repo) {
      alert('Veuillez entrer le propriétaire et le nom du repository');
      return;
    }
    
    setIsLoadingGitHub(true);
    try {
      await fetchGitHubResults(gitHubConfig.owner, gitHubConfig.repo, gitHubConfig.token, gitHubConfig.workflow);
      setShowGitHubDialog(false);
    } catch (error) {
      console.error('Error loading GitHub results:', error);
      alert(`Erreur : ${error instanceof Error ? error.message : 'Impossible de charger les résultats'}`);
    } finally {
      setIsLoadingGitHub(false);
    }
  }, [gitHubConfig, fetchGitHubResults]);

  // Créer des fichiers de test d'exemple
  const createExampleTests = useCallback(async () => {
    if (!selectedSiteId || !user?.uid) return;

    const confirmed = confirm('Cela créera 4 fichiers de test d\'exemple dans le dossier __tests__. Continuer?');
    if (!confirmed) return;

    setIsCreatingExamples(true);
    try {
      const response = await fetch('/api/tests/create-example', {
        method: 'POST',
        headers: {
          'x-user-id': user.uid,
          'x-project-id': selectedSiteId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Fichiers de test créés:\n\n' + data.files.map((f: string) => `• ${f}`).join('\n') + '\n\nLancez les tests pour les exécuter!');
      } else {
        const error = await response.json();
        alert('❌ Erreur: ' + (error.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Error creating example tests:', error);
      alert('Erreur lors de la création des tests d\'exemple');
    } finally {
      setIsCreatingExamples(false);
    }
  }, [selectedSiteId, user?.uid]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tests Automatisés</h1>
        <p className="text-muted-foreground">Exécutez et gérez vos tests unitaires, intégration et end-to-end.</p>
      </div>

      {/* Erreurs */}
      {testsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {testsError}
            <button onClick={clearError} className="ml-4 underline text-sm">Fermer</button>
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets */}
      <Tabs defaultValue="local" className="w-full">
        <TabsList>
          <TabsTrigger value="local">Tests locaux</TabsTrigger>
          <TabsTrigger value="github">
            <Github className="h-4 w-4 mr-2" />
            GitHub Actions
          </TabsTrigger>
        </TabsList>

        {/* Tab: Tests locaux */}
        <TabsContent value="local" className="space-y-8">
          {/* Site Selection */}
          {sites && sites.length > 0 && (
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Sélectionner un projet</label>
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choisir un projet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={runAllTests} disabled={runningTests.length > 0} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Lancer tous
              </Button>
              <Button 
                onClick={createExampleTests} 
                disabled={!selectedSiteId || isCreatingExamples}
                variant="outline"
                size="lg"
              >
                {isCreatingExamples ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Créer tests d'exemple
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Global Report */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Rapport global</h2>
            <p className="text-sm text-muted-foreground mb-4">Dernier run: {stats.lastRunDate}</p>
            <div className="grid md:grid-cols-4 gap-4">
              <StatCard
                title="Réussis"
                value={stats.passed.toString()}
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
              />
              <StatCard
                title="Échoués"
                value={stats.failed.toString()}
                icon={<XCircle className="h-5 w-5 text-red-500" />}
              />
              <StatCard
                title="Total"
                value={stats.total.toString()}
                icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
              />
              <StatCard
                title="Taux réussite"
                value={`${stats.successRate}%`}
                icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />}
              />
            </div>
          </div>

          {/* Test Suites */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Suites de tests</h2>
              <Dialog open={isCreatingTestSuite} onOpenChange={setIsCreatingTestSuite}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une suite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvelle suite de tests</DialogTitle>
                    <DialogDescription>
                      Configurez une nouvelle suite de tests pour votre projet.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nom de la suite</label>
                      <input
                        type="text"
                        placeholder="Ex: Tests E2E Frontend"
                        className="w-full mt-2 px-3 py-2 border rounded-md border-white/10 bg-white/5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select defaultValue="unit">
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unit">Unitaires</SelectItem>
                          <SelectItem value="integration">Intégration</SelectItem>
                          <SelectItem value="e2e">End-to-End</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Framework</label>
                      <input
                        type="text"
                        placeholder="Ex: Jest, Cypress, etc."
                        className="w-full mt-2 px-3 py-2 border rounded-md border-white/10 bg-white/5"
                      />
                    </div>
                    <Button className="w-full" onClick={() => setIsCreatingTestSuite(false)}>
                      Créer la suite
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {testSuites.map((suite) => (
                <Card key={suite.id} className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{suite.name}</h3>
                          <Badge variant="outline">{suite.type}</Badge>
                          <Badge variant="secondary">{suite.framework}</Badge>
                        </div>

                        {suite.lastRun && (
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(suite.lastRun.status)}
                              <span className="capitalize">{suite.lastRun.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              {suite.lastRun.passed}/{suite.lastRun.total}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {formatDuration(suite.lastRun.duration)}
                            </div>
                            <span className="text-xs">{suite.lastRun.date}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => runTestSuite(suite.id)}
                        disabled={runningTests.includes(suite.id) || testsLoading}
                        size="sm"
                      >
                        {runningTests.includes(suite.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Exécution...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Exécuter
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Test History */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Historique des tests</h2>
            <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                {testResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucun résultat de test pour le moment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Suite</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Résultats</TableHead>
                          <TableHead>Durée</TableHead>
                          <TableHead>Commit</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testResults.map((run) => (
                          <TableRow 
                            key={run.id}
                            className="cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => {
                              setSelectedTestResult(run);
                              setShowTestResultDialog(true);
                            }}
                          >
                            <TableCell className="font-medium">{run.name || run.suiteId}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(run.status)}
                                <span className="capitalize">{run.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-green-500">{run.passed}</span>
                                <span className="text-muted-foreground">/</span>
                                <span>{run.total}</span>
                                {run.failed > 0 && (
                                  <>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-red-500">{run.failed} échoués</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{formatDuration(run.duration)}</TableCell>
                            <TableCell>
                              {run.commitHash ? (
                                <div className="flex items-center gap-1">
                                  <GitCommit className="h-4 w-4 text-muted-foreground" />
                                  <code className="text-xs font-mono bg-white/5 px-2 py-1 rounded">
                                    {run.commitHash.substring(0, 7)}
                                  </code>
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{run.date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: GitHub Actions */}
        <TabsContent value="github" className="space-y-8">
          {testResults.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Résultats des workflows</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowGitHubDialog(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rafraîchir
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                {testResults.map((run) => (
                  <Card key={run.id} className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between gap-4">
                        {/* Colonne 1: Nom du workflow */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{run.name}</h3>
                        </div>

                        {/* Colonne 2: Statut */}
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusIcon(run.status)}
                          <span className="capitalize font-medium text-sm">
                            {run.status === 'passed' ? 'Passed' : 'Failed'}
                          </span>
                        </div>

                        {/* Colonne 3: Résultats */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-2 justify-end whitespace-nowrap">
                            <span className="font-semibold text-green-500">{run.passed}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-semibold text-white">{run.total}</span>
                            {run.failed > 0 && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <span className="font-semibold text-red-500">{run.failed} échouées</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Colonne 4: Durée */}
                        <div className="text-right shrink-0 text-sm text-muted-foreground">
                          {formatDuration(run.duration)}
                        </div>

                        {/* Colonne 5: Commit */}
                        <div className="shrink-0">
                          <div className="flex items-center gap-2">
                            <GitCommit className="h-4 w-4 text-muted-foreground" />
                            <code className="text-xs font-mono bg-white/5 px-2 py-1 rounded">
                              {run.commitHash?.substring(0, 7)}
                            </code>
                          </div>
                        </div>

                        {/* Colonne 6: Date */}
                        <div className="text-right shrink-0 text-sm text-muted-foreground">
                          {run.date}
                        </div>
                      </div>

                      {/* Rangée 2: Détails supplémentaires */}
                      {run.commitMessage && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-sm text-muted-foreground">{run.commitMessage}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    Connecter GitHub Actions
                  </CardTitle>
                  <CardDescription>Importez automatiquement les résultats de vos workflows GitHub Actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Propriétaire du repo</label>
                    <input
                      type="text"
                      placeholder="Ex: username ou organisation"
                      value={gitHubConfig.owner}
                      onChange={(e) => setGitHubConfig({...gitHubConfig, owner: e.target.value})}
                      className="w-full mt-2 px-3 py-2 border rounded-md border-white/10 bg-white/5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nom du repo</label>
                    <input
                      type="text"
                      placeholder="Ex: mon-projet"
                      value={gitHubConfig.repo}
                      onChange={(e) => setGitHubConfig({...gitHubConfig, repo: e.target.value})}
                      className="w-full mt-2 px-3 py-2 border rounded-md border-white/10 bg-white/5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Token GitHub (optionnel)</label>
                    <input
                      type="password"
                      placeholder="ghp_..."
                      value={gitHubConfig.token}
                      onChange={(e) => setGitHubConfig({...gitHubConfig, token: e.target.value})}
                      className="w-full mt-2 px-3 py-2 border rounded-md border-white/10 bg-white/5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Workflow (optionnel)</label>
                    <input
                      type="text"
                      placeholder="Ex: test, ci, main"
                      value={gitHubConfig.workflow}
                      onChange={(e) => setGitHubConfig({...gitHubConfig, workflow: e.target.value})}
                      className="w-full mt-2 px-3 py-2 border rounded-md border-white/10 bg-white/5"
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={loadGitHubResults}
                    disabled={isLoadingGitHub || !gitHubConfig.owner || !gitHubConfig.repo}
                  >
                    {isLoadingGitHub ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <Github className="h-4 w-4 mr-2" />
                        Charger les résultats
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <TestResultDialog 
        testResult={selectedTestResult}
        open={showTestResultDialog}
        onOpenChange={setShowTestResultDialog}
        suiteName={selectedTestResult?.name || selectedTestResult?.suiteId}
      />
    </div>
  );
}
