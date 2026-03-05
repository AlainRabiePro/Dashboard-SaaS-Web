/**
 * Rate limiter pour protéger les APIs
 * Limite les requêtes par IP/utilisateur
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
  windowMs: number; // Fenêtre en ms (ex: 60000 = 1 minute)
  maxRequests: number; // Max requêtes dans la fenêtre
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requêtes par minute
};

/**
 * Vérifier si une requête dépasse la limite
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;

  // Initialiser ou récupérer
  if (!store[key] || now > store[key].resetTime) {
    store[key] = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  const entry = store[key];
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = Math.max(0, entry.resetTime - now);

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count++;

  return { allowed: true, remaining: remaining - 1, resetIn };
}

/**
 * Nettoyer les entrées expirées (à appeler périodiquement)
 */
export function cleanupExpiredLimits() {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}

// Nettoyer toutes les heures
if (typeof global !== 'undefined') {
  setInterval(cleanupExpiredLimits, 60 * 60 * 1000);
}
