import {
  LogIn,
  LogOut,
  Rocket,
  Plus,
  Trash2,
  Edit,
  Settings,
  Key,
  Mail,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { formatAuditLogTime } from '@/lib/audit-log-service';
import { AuditLogEntry } from '@/lib/audit-log-service';

// Icons mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  LogIn,
  LogOut,
  Rocket,
  Plus,
  Trash2,
  Edit,
  Settings,
  Key,
  Mail,
  CheckCircle,
  Lock,
};

interface AuditLogItemProps {
  log: AuditLogEntry;
}

export function AuditLogItem({ log }: AuditLogItemProps) {
  const getIconColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'ACCEPT_INVITATION':
      case 'CREATE':
      case 'API_KEY_CREATE':
        return 'text-green-600';
      case 'DELETE':
      case 'API_KEY_DELETE':
      case 'LOGOUT':
        return 'text-red-600';
      case 'DEPLOY':
      case 'INVITE_COLLABORATOR':
        return 'text-blue-600';
      case 'SETTINGS':
      case 'UPDATE':
      case 'PERMISSIONS_CHANGE':
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'LogIn';
      case 'LOGOUT':
        return 'LogOut';
      case 'DEPLOY':
        return 'Rocket';
      case 'CREATE':
        return 'Plus';
      case 'DELETE':
      case 'API_KEY_DELETE':
        return 'Trash2';
      case 'UPDATE':
        return 'Edit';
      case 'SETTINGS':
        return 'Settings';
      case 'API_KEY_CREATE':
        return 'Key';
      case 'INVITE_COLLABORATOR':
        return 'Mail';
      case 'ACCEPT_INVITATION':
        return 'CheckCircle';
      case 'PERMISSIONS_CHANGE':
        return 'Lock';
      default:
        return 'Edit';
    }
  };

  const iconName = getActionIcon(log.action);
  const IconComponent = iconMap[iconName];
  const colorClass = getIconColor(log.action);
  const timeString = formatAuditLogTime(log.timestamp);

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-200 last:border-0">
      {/* Icon */}
      <div className={`mt-1 flex-shrink-0 ${colorClass}`}>
        {IconComponent ? <IconComponent size={20} /> : null}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm text-gray-900">
              {log.action}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{log.title}</p>
          </div>
        </div>

        {/* Description */}
        {log.description && (
          <p className="text-sm text-gray-700 mt-2">{log.description}</p>
        )}

        {/* Metadata */}
        {log.metadata && (
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            {Object.entries(log.metadata).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        )}

        {/* IP Address */}
        {log.ip && (
          <p className="text-xs text-gray-500 mt-2">IP: {log.ip}</p>
        )}
      </div>

      {/* Time */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xs text-gray-500 font-medium">{timeString}</p>
      </div>
    </div>
  );
}
