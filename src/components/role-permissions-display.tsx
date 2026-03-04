'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLE_PERMISSIONS, ROLE_DESCRIPTIONS, type UserRole } from '@/lib/collaborator-service';

const ROLES: UserRole[] = ['admin', 'editor', 'reader'];

export function RolePermissionsDisplay() {
  return (
    <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Rôles et permissions</CardTitle>
        <CardDescription>Définir les niveaux d'accès</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ROLES.map((role) => (
          <div
            key={role}
            className="p-4 rounded-md border border-white/10 bg-white/2"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-sm capitalize">{role}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {ROLE_PERMISSIONS[role].map((permission) => (
                <div key={permission.name} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Owner (read-only) */}
        <div
          className="p-4 rounded-md border border-blue-500/20 bg-blue-500/5"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-sm text-blue-400">Propriétaire</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ROLE_DESCRIPTIONS['owner']}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {ROLE_PERMISSIONS['owner'].map((permission) => (
              <div key={permission.name} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-muted-foreground">{permission.description}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-3 italic">
            ℹ️ Vous êtes actuellement propriétaire de cet espace de travail
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
