import { ReactNode } from 'react';
import { hasPermission, type UserRole } from '@/lib/collaborator-service';

interface PermissionGuardProps {
  permission: string;
  userRole: UserRole;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Composant qui n'affiche le contenu que si l'utilisateur a la permission
 */
export function PermissionGuard({
  permission,
  userRole,
  fallback = null,
  children,
}: PermissionGuardProps) {
  if (!hasPermission(userRole, permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

interface RoleGuardProps {
  requiredRole: 'owner' | 'admin' | 'editor' | 'reader';
  userRole: UserRole;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Composant qui n'affiche le contenu que si l'utilisateur a le rôle requis ou supérieur
 */
export function RoleGuard({
  requiredRole,
  userRole,
  fallback = null,
  children,
}: RoleGuardProps) {
  const roleHierarchy: Record<UserRole, number> = {
    owner: 4,
    admin: 3,
    editor: 2,
    reader: 1,
  };

  const requiredLevel = roleHierarchy[requiredRole];
  const userLevel = roleHierarchy[userRole];

  if (userLevel < requiredLevel) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

interface MultiPermissionGuardProps {
  permissions: string[];
  userRole: UserRole;
  mode?: 'all' | 'any'; // 'all' = a toutes les permissions, 'any' = a au moins une
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Composant qui n'affiche le contenu que si l'utilisateur a les permissions requises
 */
export function MultiPermissionGuard({
  permissions,
  userRole,
  mode = 'all',
  fallback = null,
  children,
}: MultiPermissionGuardProps) {
  const hasPermissions = permissions[mode === 'all' ? 'every' : 'some'](
    (permission) => hasPermission(userRole, permission)
  );

  if (!hasPermissions) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
