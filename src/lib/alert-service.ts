/**
 * Service pour gérer les alertes basées sur les métriques
 */

export interface AlertRule {
  id: string;
  name: string;
  metric: 'uptime' | 'latency' | 'errorRate';
  operator: '>' | '<' | '>=' | '<=';
  threshold: number;
  enabled: boolean;
}

export interface Alert {
  id: string;
  siteId: string;
  rule: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

/**
 * Règles d'alerte par défaut
 */
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'uptime-low',
    name: 'Uptime faible',
    metric: 'uptime',
    operator: '<',
    threshold: 99,
    enabled: true,
  },
  {
    id: 'uptime-critical',
    name: 'Uptime critique',
    metric: 'uptime',
    operator: '<',
    threshold: 90,
    enabled: true,
  },
  {
    id: 'latency-high',
    name: 'Latence élevée',
    metric: 'latency',
    operator: '>',
    threshold: 500,
    enabled: true,
  },
  {
    id: 'latency-critical',
    name: 'Latence critique',
    metric: 'latency',
    operator: '>',
    threshold: 1000,
    enabled: true,
  },
  {
    id: 'error-rate-high',
    name: 'Taux d\'erreur élevé',
    metric: 'errorRate',
    operator: '>',
    threshold: 1,
    enabled: true,
  },
  {
    id: 'error-rate-critical',
    name: 'Taux d\'erreur critique',
    metric: 'errorRate',
    operator: '>',
    threshold: 5,
    enabled: true,
  },
];

/**
 * Évalue si une alerte doit être déclenchée
 */
export function shouldTriggerAlert(
  rule: AlertRule,
  metricValue: number
): boolean {
  if (!rule.enabled) return false;

  switch (rule.operator) {
    case '>':
      return metricValue > rule.threshold;
    case '>=':
      return metricValue >= rule.threshold;
    case '<':
      return metricValue < rule.threshold;
    case '<=':
      return metricValue <= rule.threshold;
    default:
      return false;
  }
}

/**
 * Détermine la sévérité d'une alerte
 */
export function determineSeverity(
  rule: AlertRule
): 'info' | 'warning' | 'critical' {
  // Les alertes "critical" se terminent par "critical"
  if (rule.id.includes('critical')) return 'critical';
  // Les autres sont des warnings
  return 'warning';
}

/**
 * Génère un message d'alerte lisible
 */
export function generateAlertMessage(
  rule: AlertRule,
  metricValue: number
): string {
  const metric = {
    uptime: 'Uptime',
    latency: 'Latence',
    errorRate: 'Taux d\'erreur',
  }[rule.metric];

  const unit = {
    uptime: '%',
    latency: 'ms',
    errorRate: '%',
  }[rule.metric];

  return `${rule.name}: ${metric} = ${metricValue.toFixed(2)}${unit}`;
}

/**
 * Crée une alerte
 */
export function createAlert(
  siteId: string,
  rule: AlertRule,
  metricValue: number
): Alert {
  return {
    id: `${siteId}-${rule.id}-${Date.now()}`,
    siteId,
    rule: rule.id,
    severity: determineSeverity(rule),
    message: generateAlertMessage(rule, metricValue),
    timestamp: Date.now(),
    resolved: false,
  };
}
