/**
 * Service pour gérer les limites par plan d'abonnement et les add-ons
 */

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type AddOn = 'collaborators';

export interface SubscriptionLimits {
  plan: SubscriptionPlan;
  maxInvitations: number;
  maxProjects: number;
  maxStorageGB: number;
  features: string[];
}

export interface AddOnConfig {
  id: AddOn;
  name: string;
  description: string;
  price: number; // en cents (200 = 2€)
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  maxInvitationsPerProject: number;
  stripeProductId?: string;
  stripePriceId?: string;
}

/**
 * Configuration des add-ons payants
 */
export const ADD_ONS: Record<AddOn, AddOnConfig> = {
  collaborators: {
    id: 'collaborators',
    name: 'Team Collaborators',
    description: 'Invite up to 3 people per project',
    price: 200, // 2€ par mois
    currency: 'EUR',
    billingPeriod: 'monthly',
    maxInvitationsPerProject: 3,
    stripeProductId: 'prod_collaborators', // À obtenir de Stripe
    stripePriceId: 'price_collaborators_monthly', // À obtenir de Stripe
  },
};

export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  free: {
    plan: 'free',
    maxInvitations: 0, // 0 sauf si add-on collaborators activé
    maxProjects: 1,
    maxStorageGB: 5,
    features: ['Basic analytics', 'Community support'],
  },
  pro: {
    plan: 'pro',
    maxInvitations: 0, // Nécessite aussi l'add-on
    maxProjects: 5,
    maxStorageGB: 50,
    features: ['Advanced analytics', 'Email support'],
  },
  enterprise: {
    plan: 'enterprise',
    maxInvitations: 3, // Inclus dans le plan
    maxProjects: 999,
    maxStorageGB: 500,
    features: ['Unlimited analytics', 'Priority support', 'Unlimited team members', 'Custom domain'],
  },
};

/**
 * Obtient les limites pour un plan
 */
export function getLimitsForPlan(plan: SubscriptionPlan): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[plan] || SUBSCRIPTION_LIMITS.free;
}

/**
 * Obtient la config d'un add-on
 */
export function getAddOnConfig(addOnId: AddOn): AddOnConfig {
  return ADD_ONS[addOnId];
}

/**
 * Obtient le prix mensuel d'un add-on en euros
 */
export function getAddOnPrice(addOnId: AddOn): number {
  return ADD_ONS[addOnId].price / 100; // Convertir cents en euros
}

/**
 * Vérifie si un utilisateur a activé l'add-on collaborators
 */
export function hasCollaboratorsAddOn(activeAddOns: string[]): boolean {
  return activeAddOns.includes('collaborators');
}

/**
 * Obtient le nombre max d'invitations basé sur plan + add-ons
 */
export function getMaxInvitations(plan: SubscriptionPlan, activeAddOns: string[]): number {
  const baseLimits = getLimitsForPlan(plan);
  
  // Enterprise inclut les collaborateurs
  if (plan === 'enterprise') {
    return baseLimits.maxInvitations;
  }
  
  // Free/Pro nécessitent l'add-on
  if (hasCollaboratorsAddOn(activeAddOns)) {
    return ADD_ONS.collaborators.maxInvitationsPerProject;
  }
  
  return 0;
}

/**
 * Vérifie si on peut inviter plus de personnes
 */
export function canInviteMore(plan: SubscriptionPlan, activeAddOns: string[], currentCount: number): boolean {
  const maxInvitations = getMaxInvitations(plan, activeAddOns);
  return currentCount < maxInvitations && maxInvitations > 0;
}

/**
 * Obtient le nombre de places restantes
 */
export function getRemainingSlots(plan: SubscriptionPlan, activeAddOns: string[], currentCount: number): number {
  const maxInvitations = getMaxInvitations(plan, activeAddOns);
  return Math.max(0, maxInvitations - currentCount);
}
