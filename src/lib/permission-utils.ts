/**
 * Utilitaires pour vérifier les permissions utilisateur
 */

import { type UserRole, hasPermission } from '@/lib/collaborator-service';

export interface PermissionContext {
  userRole: UserRole;
}

/**
 * Crée un checker de permissions basé sur le rôle
 */
export function createPermissionChecker(userRole: UserRole) {
  return {
    can: (permission: string) => hasPermission(userRole, permission),
    canManageTeam: () => hasPermission(userRole, 'manage_team'),
    canManagePermissions: () => hasPermission(userRole, 'manage_permissions'),
    canManageBilling: () => hasPermission(userRole, 'manage_billing'),
    canManageSettings: () => hasPermission(userRole, 'manage_settings'),
    canDeleteWorkspace: () => hasPermission(userRole, 'delete_workspace'),
    canManageDeployments: () => hasPermission(userRole, 'manage_deployments'),
    canManageDatabase: () => hasPermission(userRole, 'manage_database'),
    canViewLogs: () => hasPermission(userRole, 'view_logs'),
    canRunTests: () => hasPermission(userRole, 'run_tests'),
  };
}

/**
 * Obtient le niveau d'accès numériquement (pour comparaisons simples)
 */
export function getRoleLevel(role: UserRole): number {
  const levels: Record<UserRole, number> = {
    owner: 4,
    admin: 3,
    editor: 2,
    reader: 1,
  };
  return levels[role] ?? 0;
}

/**
 * Vérifie si un rôle a un accès supérieur ou égal à un autre
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

/**
 * Wrapper garde pour les composants (utile pour React)
 */
export function requirePermission(permission: string, userRole: UserRole): boolean {
  return hasPermission(userRole, permission);
}

/**
 * Wrapper garde pour les rôles
 */
export function requireRole(requiredRole: UserRole, userRole: UserRole): boolean {
  return hasRoleLevel(userRole, requiredRole);
}
