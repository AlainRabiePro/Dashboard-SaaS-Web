/**
 * Service pour collecter les métriques de santé réelles des sites
 * Ping les sites web, mesure la latence, et enregistre les erreurs
 */

export interface HealthCheckResult {
  domain: string;
  status: number;
  latency: number;
  timestamp: number;
  healthy: boolean;
}

export interface HealthMetrics {
  uptime: number; // En pourcentage
  latency: number; // En ms
  errorRate: number; // En pourcentage
  lastCheck: number; // Timestamp
  checkCount: number;
  errorCount: number;
}

/**
 * Effectue un health check sur un site
 * Retourne le code de statut HTTP et la latence
 */
export async function performHealthCheck(domain: string): Promise<HealthCheckResult> {
  const start = Date.now();
  
  // Construire l'URL avec protocol si nécessaire
  let url = domain;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    // Timeout de 10 secondes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    return {
      domain,
      status: response.status,
      latency,
      timestamp: Date.now(),
      healthy: response.ok,
    };
  } catch (error) {
    const latency = Date.now() - start;
    
    // Retourner un statut d'erreur
    return {
      domain,
      status: 0,
      latency,
      timestamp: Date.now(),
      healthy: false,
    };
  }
}

/**
 * Calcule les métriques agrégées à partir d'un ensemble de résultats
 */
export function calculateMetrics(results: HealthCheckResult[]): HealthMetrics {
  if (results.length === 0) {
    return {
      uptime: 100,
      latency: 0,
      errorRate: 0,
      lastCheck: Date.now(),
      checkCount: 0,
      errorCount: 0,
    };
  }

  const healthyCount = results.filter(r => r.healthy).length;
  const errorCount = results.filter(r => !r.healthy).length;
  const avgLatency = Math.round(
    results.reduce((sum, r) => sum + r.latency, 0) / results.length
  );

  return {
    uptime: (healthyCount / results.length) * 100,
    latency: avgLatency,
    errorRate: (errorCount / results.length) * 100,
    lastCheck: Date.now(),
    checkCount: results.length,
    errorCount,
  };
}

/**
 * Formats metrics pour l'affichage
 */
export function formatMetrics(metrics: HealthMetrics) {
  return {
    uptime: parseFloat(metrics.uptime.toFixed(2)),
    latency: metrics.latency,
    errorRate: parseFloat(metrics.errorRate.toFixed(2)),
    lastCheck: metrics.lastCheck,
    checkCount: metrics.checkCount,
    errorCount: metrics.errorCount,
  };
}
