# Système d'Audit Log - Documentation

## Vue d'ensemble

Le système d'Audit Log automatise le suivi de toutes les actions effectuées sur votre compte. Il enregistre:
- ✅ **Connexions/Déconnexions** (LOGIN, LOGOUT)
- ✅ **Déploiements** (DEPLOY)
- ✅ **Modifications** (SETTINGS, UPDATE)
- ✅ **Créations** (CREATE, API_KEY_CREATE, INVITE_COLLABORATOR)
- ✅ **Suppressions** (DELETE, API_KEY_DELETE)
- ✅ **Permissions** (PERMISSIONS_CHANGE, ACCEPT_INVITATION)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Page Audit Log (src/app/(dashboard)/audit/page.tsx)         │
│  - Fetch logs avec useAuditLogs()                           │
│  - Display AuditLogItem + AuditLogsStats                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ Hook: useAuditLogs (src/hooks/use-audit-logs.ts)            │
│  - fetchLogs() : GET /api/audit-logs                        │
│  - createLog() : POST /api/audit-logs                       │
│  - refetch() : Re-fetch avec stats                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ API: /api/audit-logs/route.ts                               │
│  - GET: Récupère logs (limit, days) + stats                 │
│  - POST: Crée nouvelle entrée + seed si vide                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ Firestore: users/{userId}/audit_logs/{logId}                │
│ Structure:                                                   │
│  - action (AuditLogAction)                                  │
│  - title (string)                                           │
│  - description (string)                                     │
│  - timestamp (number - milliseconds)                        │
│  - ip (string - optional)                                   │
│  - userAgent (string - optional)                            │
│  - metadata (object - optional)                             │
│  - resourceId (string - optional)                           │
│  - resourceType (string - optional)                         │
└─────────────────────────────────────────────────────────────┘
```

## Types Disponibles

### AuditLogAction (12 actions)
```typescript
type AuditLogAction = 
  | 'LOGIN'                 // Connexion réussie
  | 'LOGOUT'                // Déconnexion
  | 'DEPLOY'                // Déploiement de site
  | 'CREATE'                // Création générique
  | 'DELETE'                // Suppression générique
  | 'UPDATE'                // Modification générique
  | 'SETTINGS'              // Changement paramètres
  | 'API_KEY_CREATE'        // Création clé API
  | 'API_KEY_DELETE'        // Suppression clé API
  | 'INVITE_COLLABORATOR'   // Invitation collaborateur
  | 'ACCEPT_INVITATION'     // Acceptation invitation
  | 'PERMISSIONS_CHANGE';   // Changement permissions
```

### AuditLogEntry
```typescript
interface AuditLogEntry {
  id: string;
  action: AuditLogAction;
  title: string;              // Auto-généré à partir du service
  description: string;        // Texte personnalisé
  userId: string;
  timestamp: number;          // Millisecondes
  ip?: string;                // Client IP
  userAgent?: string;         // Client User Agent
  metadata?: { [key: string]: any };
  resourceId?: string;        // Ex: site-yZOECakb
  resourceType?: string;      // Ex: 'site' | 'api-key'
}
```

## Utilisation

### 1. Dans les Composants

```typescript
import { useAuditLogs } from '@/hooks/use-audit-logs';

export function MonComponent() {
  const { logs, stats, createLog } = useAuditLogs(30);

  const handleDelete = async (itemId: string) => {
    // Faire la suppression...
    
    // Créer le log
    await createLog('DELETE', `Suppression d'un élément: ${itemId}`, {
      itemId,
      itemType: 'document'
    });
  };

  return (
    <div>
      <p>Suppressions: {stats.deletions}</p>
      <button onClick={() => handleDelete('item-123')}>Supprimer</button>
    </div>
  );
}
```

### 2. Dans les API Routes

```typescript
import { createAuditLogEntry } from '@/lib/audit-log-service';
import { addDoc, collection } from 'firebase/firestore';
import { getFirestore, getApp } from 'firebase/app';

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  // ... logique de suppression...
  
  // Créer le log d'audit
  const db = getFirestore(getApp());
  const auditRef = collection(db, 'users', userId, 'audit_logs');
  
  await addDoc(auditRef, {
    ...createAuditLogEntry(
      'DELETE',
      'Suppression d\'une clé API',
      userId,
      { apiKeyId: 'key-123' },
      'key-123',
      'api-key'
    ),
    ip: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  return NextResponse.json({ success: true });
}
```

### 3. Affichage sur la Page Audit

```typescript
import { AuditLogItem } from '@/components/audit-log-item';
import { AuditLogsStats } from '@/components/audit-logs-stats';

// Liste des logs
logs.map(log => <AuditLogItem key={log.id} log={log} />)

// Statistiques récapitulatives
<AuditLogsStats
  logins={stats.logins}
  deployments={stats.deployments}
  modifications={stats.modifications}
  deletions={stats.deletions}
/>
```

## Intégration Existante

Les pages suivantes peuvent facilement enregistrer leurs actions:

### Pages Candidates pour Audit Logging

1. **API Keys** (`src/app/(dashboard)/api-keys`)
   - Créer une clé: `API_KEY_CREATE`
   - Supprimer une clé: `API_KEY_DELETE`

2. **Déploiements** (`src/app/(dashboard)/deployments`)
   - Nouveau déploiement: `DEPLOY`

3. **Base de données** (`src/app/(dashboard)/database`)
   - Création collection: `CREATE`
   - Modification config: `UPDATE`

4. **Collaborateurs** (`src/app/(dashboard)/collaborators`)
   - Invitation: `INVITE_COLLABORATOR`
   - Changement permission: `PERMISSIONS_CHANGE`

5. **Paramètres** (`src/app/(dashboard)/settings`)
   - Changement profil: `SETTINGS`
   - Changement thème: `SETTINGS`

6. **Auth** (`src/app/login`, `src/app/(dashboard)/console`)
   - Login: `LOGIN` (automatique via API)
   - Logout: `LOGOUT` (à implémenter)

## Seed Automatique

Si l'utilisateur n'a pas de logs d'audit, le système génère automatiquement 10 entrées de test (2-29 jours dans le passé) pour démonstration.

```typescript
// src/app/api/audit-logs/route.ts
async function seedAuditLogs(userId: string) {
  // Création de 10 logs fictifs pour démo
  // Disponible immédiatement au premier appel GET
}
```

## Statistiques

Le système retourne automatiquement les stats:
```json
{
  "logins": 3,
  "deployments": 3,
  "modifications": 2,
  "deletions": 1
}
```

## Sécurité

✅ **x-user-id header** requis sur toutes les requêtes
✅ **Sous-collection Firestore** isolée par utilisateur
✅ **IP tracking** optionnel pour sécurité
✅ **User Agent** enregistré pour détection anomalies

## Prochaines Étapes

1. **Intégrer dans API existantes** - Ajouter les appels createLog() dans:
   - `/api/deploy-site`
   - `/api/api-keys`
   - `/api/delete-site`
   - `/api/settings`

2. **Alertes** - Créer des alertes si:
   - 10+ login failures en 1h
   - Déploiement massive (>100MB)
   - Changement permissions critiques

3. **Export** - Ajouter bouton "Export CSV" sur la page audit

4. **Recherche/Filtrage** - Permettre filtrer par:
   - Type d'action
   - Date range
   - Ressource

5. **Archivage** - Archiver logs >90 jours automatiquement
