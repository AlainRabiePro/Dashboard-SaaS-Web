/**
 * Service pour gérer les audit logs
 */

export type AuditLogAction = 
  | 'LOGIN' 
  | 'LOGOUT'
  | 'DEPLOY' 
  | 'CREATE' 
  | 'DELETE' 
  | 'UPDATE' 
  | 'SETTINGS'
  | 'API_KEY_CREATE'
  | 'API_KEY_DELETE'
  | 'INVITE_COLLABORATOR'
  | 'ACCEPT_INVITATION'
  | 'PERMISSIONS_CHANGE';

export interface AuditLogEntry {
  id: string;
  action: AuditLogAction;
  title: string;
  description: string;
  userId: string;
  userEmail?: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  metadata?: {
    [key: string]: any;
  };
  resourceId?: string;
  resourceType?: string;
}

/**
 * Descriptions des actions pour l'affichage
 */
export const ACTION_DESCRIPTIONS: Record<AuditLogAction, {
  title: string;
  icon: string;
  color: string;
}> = {
  LOGIN: {
    title: 'Connexion à votre compte',
    icon: 'LogIn',
    color: 'green',
  },
  LOGOUT: {
    title: 'Déconnexion',
    icon: 'LogOut',
    color: 'gray',
  },
  DEPLOY: {
    title: 'Déploiement de site',
    icon: 'Rocket',
    color: 'blue',
  },
  CREATE: {
    title: 'Création d\'une ressource',
    icon: 'Plus',
    color: 'green',
  },
  DELETE: {
    title: 'Suppression',
    icon: 'Trash2',
    color: 'red',
  },
  UPDATE: {
    title: 'Modification',
    icon: 'Edit',
    color: 'amber',
  },
  SETTINGS: {
    title: 'Modification des paramètres',
    icon: 'Settings',
    color: 'amber',
  },
  API_KEY_CREATE: {
    title: 'Création d\'une clé API',
    icon: 'Key',
    color: 'green',
  },
  API_KEY_DELETE: {
    title: 'Suppression d\'une clé API',
    icon: 'Trash2',
    color: 'red',
  },
  INVITE_COLLABORATOR: {
    title: 'Invitation collaborateur',
    icon: 'Mail',
    color: 'blue',
  },
  ACCEPT_INVITATION: {
    title: 'Acceptation d\'invitation',
    icon: 'CheckCircle',
    color: 'green',
  },
  PERMISSIONS_CHANGE: {
    title: 'Changement de permissions',
    icon: 'Lock',
    color: 'amber',
  },
};

/**
 * Format l'horodatage pour l'affichage
 */
export function formatAuditLogTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes}m`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 30) return `Il y a ${days}j`;

  return new Date(timestamp).toLocaleDateString('fr-FR');
}

/**
 * Obtient l'IP cliente (avec fallback)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Obtient le user agent
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Crée une entrée d'audit log
 */
export function createAuditLogEntry(
  action: AuditLogAction,
  description: string,
  userId: string,
  metadata?: any,
  resourceId?: string,
  resourceType?: string
): Omit<AuditLogEntry, 'id' | 'userEmail' | 'ip' | 'userAgent'> {
  const actionData = ACTION_DESCRIPTIONS[action];

  return {
    action,
    title: actionData.title,
    description,
    userId,
    timestamp: Date.now(),
    metadata,
    resourceId,
    resourceType,
  };
}
