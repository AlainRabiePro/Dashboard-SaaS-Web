import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, GitCommit } from "lucide-react";

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  if (seconds < 60) return `${seconds}.${String(milliseconds).padStart(3, '0')}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

interface TestResult {
  id: string;
  suiteId: string;
  status: 'passed' | 'failed' | 'running';
  passed: number;
  failed: number;
  total: number;
  duration: number;
  date: string;
  commitHash?: string;
  output?: string;
  error?: string;
}

interface TestResultDialogProps {
  testResult: TestResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suiteName?: string;
}

export function TestResultDialog({
  testResult,
  open,
  onOpenChange,
  suiteName,
}: TestResultDialogProps) {
  if (!testResult) return null;

  const statusColor = testResult.status === 'passed' ? 'text-green-500' : 'text-red-500';
  const statusIcon = testResult.status === 'passed' ? 
    <CheckCircle2 className={`h-5 w-5 ${statusColor}`} /> : 
    <XCircle className={`h-5 w-5 ${statusColor}`} />;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {statusIcon}
            {suiteName || testResult.suiteId}
          </DialogTitle>
          <DialogDescription>
            Résultats détaillés de l'exécution du test
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message d'erreur si applicable */}
          {testResult.error && (
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <h3 className="font-semibold text-red-400 mb-2">⚠️ Erreur lors de l'exécution</h3>
              <p className="text-sm text-red-200">{testResult.error}</p>
            </div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-white/5">
              <div className="text-sm text-muted-foreground mb-1">Statut</div>
              <div className="flex items-center gap-2">
                {statusIcon}
                <span className="font-semibold capitalize">{testResult.status}</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-lg p-4 border border-white/5">
              <div className="text-sm text-muted-foreground mb-1">Résultats</div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-semibold">{testResult.passed}/{testResult.total}</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-lg p-4 border border-white/5">
              <div className="text-sm text-muted-foreground mb-1">Durée</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{formatDuration(testResult.duration)}</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-lg p-4 border border-white/5">
              <div className="text-sm text-muted-foreground mb-1">Commit</div>
              <div className="flex items-center gap-2">
                <GitCommit className="h-4 w-4" />
                <span className="font-mono text-sm">{testResult.commitHash || '-'}</span>
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Date d'exécution:</span>
              <div className="mt-1">{new Date(testResult.date).toLocaleString('fr-FR')}</div>
            </div>
            <div>
              <span className="text-muted-foreground">ID du résultat:</span>
              <div className="mt-1 font-mono text-xs break-all">{testResult.id}</div>
            </div>
          </div>

          {/* Output du test */}
          {testResult.output && (
            <div className="space-y-2">
              <h3 className="font-semibold">Parcours du test</h3>
              <div className="bg-black/50 rounded-lg p-4 border border-white/10 font-mono text-sm max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words text-green-400">
                  {testResult.output}
                </pre>
              </div>
            </div>
          )}

          {/* Résumé des écheccs si applicable */}
          {testResult.failed > 0 && testResult.output && (
            <div className="space-y-2">
              <h3 className="font-semibold text-red-400">⚠️ {testResult.failed} test(s) échoué(s)</h3>
              <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                <p className="text-sm text-red-200">
                  Consultez le parcours du test ci-dessus pour plus de détails sur les erreurs.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
