/**
 * Configuration des prix des domaines à la revente
 * À personnaliser selon votre stratégie commerciale
 */

export const DOMAIN_PRICING = {
  default: 9.99, // Prix par défaut
  extensions: {
    '.com': 8.99,
    '.fr': 5.99,
    '.co': 10.99,
    '.io': 15.99,
    '.dev': 12.99,
    '.app': 11.99,
    '.online': 7.99,
    '.site': 6.99,
  }
};

/**
 * Obtenir le prix recommandé pour un domaine
 */
export function getRecommendedPrice(domain: string): number {
  const extension = domain.substring(domain.lastIndexOf('.'));
  return DOMAIN_PRICING.extensions[extension as keyof typeof DOMAIN_PRICING.extensions] || DOMAIN_PRICING.default;
}

/**
 * Durée d'expiration des commandes (en heures)
 */
export const ORDER_EXPIRATION_HOURS = 24;

/**
 * Conditions de revente
 */
export const RESELLER_TERMS = {
  minPrice: 4.99,
  maxPrice: 999.99,
  currency: 'EUR',
  paymentProvider: 'stripe', // À remplacer par votre provider
};
