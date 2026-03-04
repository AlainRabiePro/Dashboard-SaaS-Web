import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Rocket, Edit, Trash2 } from 'lucide-react';

interface AuditLogsStatsProps {
  logins: number;
  deployments: number;
  modifications: number;
  deletions: number;
}

export function AuditLogsStats({
  logins,
  deployments,
  modifications,
  deletions,
}: AuditLogsStatsProps) {
  const stats = [
    {
      label: 'Connexions',
      value: logins,
      icon: LogIn,
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
    },
    {
      label: 'Déploiements',
      value: deployments,
      icon: Rocket,
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
    },
    {
      label: 'Modifications',
      value: modifications,
      icon: Edit,
      bgColor: 'bg-amber-600',
      iconColor: 'text-white',
    },
    {
      label: 'Suppressions',
      value: deletions,
      icon: Trash2,
      bgColor: 'bg-red-600',
      iconColor: 'text-white',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Statistiques</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Résumé de vos activités</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={20} className={stat.iconColor} />
                </div>
                <p className="text-2xl font-bold text-white dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
