/**
 * Service pour gérer les collaborateurs et leurs permissions
 */

export type UserRole = 'owner' | 'admin' | 'editor' | 'reader';

export interface Permission {
  name: string;
  description: string;
}

export interface RolePermissions {
  owner: Permission[];
  admin: Permission[];
  editor: Permission[];
  reader: Permission[];
}

export interface Collaborator {
  id: string;
  userId?: string;
  email: string;
  name?: string;
  role: UserRole;
  status: 'active' | 'invited' | 'pending';
  invitedAt?: number;
  acceptedAt?: number;
  invitationToken?: string;
  invitationExpiresAt?: number;
}

/**
 * Permissions associées à chaque rôle
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  owner: [
    { name: 'manage_team', description: 'Gérer l\'équipe et les invitations' },
    { name: 'manage_permissions', description: 'Gérer les permissions' },
    { name: 'manage_billing', description: 'Gérer la facturation' },
    { name: 'manage_settings', description: 'Gérer les paramètres' },
    { name: 'delete_workspace', description: 'Supprimer l\'espace de travail' },
    { name: 'manage_deployments', description: 'Déployer et gérer les sites' },
    { name: 'manage_database', description: 'Gérer la base de données' },
    { name: 'view_logs', description: 'Voir les logs' },
    { name: 'run_tests', description: 'Exécuter les tests' },
  ],
  admin: [
    { name: 'manage_team', description: 'Gérer l\'équipe et les invitations' },
    { name: 'manage_permissions', description: 'Gérer les permissions' },
    { name: 'manage_settings', description: 'Gérer les paramètres' },
    { name: 'manage_deployments', description: 'Déployer et gérer les sites' },
    { name: 'manage_database', description: 'Gérer la base de données' },
    { name: 'view_logs', description: 'Voir les logs' },
    { name: 'run_tests', description: 'Exécuter les tests' },
  ],
  editor: [
    { name: 'manage_deployments', description: 'Déployer et gérer les sites' },
    { name: 'manage_database', description: 'Gérer la base de données' },
    { name: 'view_logs', description: 'Voir les logs' },
    { name: 'run_tests', description: 'Exécuter les tests' },
  ],
  reader: [
    { name: 'view_logs', description: 'Voir les logs' },
  ],
};

/**
 * Descriptions des rôles
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'Accès complet à tous les outils et paramètres',
  admin: 'Gestion complète sauf facturation',
  editor: 'Déployer et gérer les sites',
  reader: 'Accès en lecture seule',
};

/**
 * Obtient les permissions pour un rôle donné
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Vérifie si un rôle a une permission spécifique
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.some(p => p.name === permission);
}

/**
 * Génère un token d'invitation unique
 */
export function generateInvitationToken(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Valide un email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Vérifie si une invitation a expiré (24 heures)
 */
export function isInvitationExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/**
 * Génère une expiration d'invitation (24 heures à partir de maintenant)
 */
export function generateInvitationExpiry(): number {
  return Date.now() + 24 * 60 * 60 * 1000; // 24 heures
}
