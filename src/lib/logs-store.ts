/**
 * Store in-memory pour les logs d'exécution de commandes
 * Utilise globalThis pour survivre aux hot reloads de Next.js
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'debug' | 'warn' | 'error';
  message: string;
  source: string;
  stack?: string;
}

interface ProjectLogs {
  timestamp: string;
  logs: LogEntry[];
}

// Utiliser globalThis pour persister entre les hot reloads
declare global {
  var logsStore: Map<string, ProjectLogs>;
}

if (!globalThis.logsStore) {
  globalThis.logsStore = new Map<string, ProjectLogs>();
}

const logsStore = globalThis.logsStore;

/**
 * Ajoute un log pour un projet
 */
export function addProjectLog(projectId: string, log: Omit<LogEntry, 'timestamp'>) {
  if (!logsStore.has(projectId)) {
    logsStore.set(projectId, {
      timestamp: new Date().toISOString(),
      logs: []
    });
  }

  const projectLogs = logsStore.get(projectId)!;
  projectLogs.logs.push({
    ...log,
    timestamp: new Date().toISOString()
  });

  // Limiter à 100 logs par projet (FIFO)
  if (projectLogs.logs.length > 100) {
    projectLogs.logs.shift();
  }
}

/**
 * Retourne tous les logs d'un projet
 */
export function getProjectLogs(projectId: string): ProjectLogs {
  return logsStore.get(projectId) || {
    timestamp: new Date().toISOString(),
    logs: []
  };
}

/**
 * Ajoute plusieurs logs à la fois (pour le stdout/stderr d'une commande)
 */
export function addCommandOutput(projectId: string, output: string, level: 'info' | 'error' = 'info') {
  if (!output) return;

  // Découper par lignes et ajouter chaque ligne comme un log
  const lines = output.split('\n').filter(line => line.trim());
  lines.forEach(line => {
    addProjectLog(projectId, {
      level,
      message: line,
      source: 'command-execution'
    });
  });
}

/**
 * Efface les logs d'un projet
 */
export function clearProjectLogs(projectId: string) {
  logsStore.delete(projectId);
}
