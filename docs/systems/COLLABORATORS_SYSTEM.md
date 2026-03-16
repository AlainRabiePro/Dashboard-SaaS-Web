# Système de Collaborateurs - Documentation

## Vue d'ensemble

Le système de collaborateurs permet de gérer l'accès d'équipe avec:
- ✅ Rôles et permissions granulaires
- ✅ Invitations par email (préparées)
- ✅ Gestion dynamique des accès
- ✅ Guards de permissions pour les composants

## Architecture

### Types & Services

**`src/lib/collaborator-service.ts`**
- Définit les types `UserRole`, `Collaborator`, `Permission`
- Gère les rôles et leurs permissions
- Utilitaires de validation et génération de tokens

**`src/lib/permission-utils.ts`**
- Checkers de permissions
- Hiérarchie de rôles
- Guards de sécurité

### API Routes

**`src/app/api/collaborators/route.ts`**
- `GET` - Liste tous les collaborateurs
- `POST` - Invite un nouveau collaborateur
- `PATCH` - Met à jour le rôle
- `DELETE` - Supprime un collaborateur

### Composants

**`InviteCollaboratorDialog`**
- Dialog pour inviter un collaborateur
- Sélection du rôle
- Validation d'email
- Messages de succès/erreur

**`CollaboratorRow`**
- Affiche un collaborateur avec ses actions
- Dropdown pour changer le rôle
- Bouton suppressin avec confirmation
- Badge de statut (actif/invité)

**`RolePermissionsDisplay`**
- Affiche les permissions par rôle
- Vue lisible des capacités

**`PermissionGuard`, `RoleGuard`, `MultiPermissionGuard`**
- Composants pour contrôler l'affichage basé sur permissions
- Fallback optionnel si pas autorisation

### Hooks

**`useCollaborators`**
- Gère tous les appels API
- États de chargement
- Refresh automatique

## Rôles & Permissions

### Propriétaire (Owner)
- Accès complet à tous les outils
- Gestion complète de l'équipe
- Gestion de la facturation
- Suppression de l'espace de travail

### Admin
- Gestion complète sauf facturation
- Gestion de l'équipe et permissions
- Gérer paramètres et sites
- Accès logs et tests

### Éditeur (Editor)
- Déployer et gérer les sites
- Accès à la base de données
- Voir les logs
- Exécuter les tests

### Lecteur (Reader)
- Accès en lecture seule
- Voir les logs

## Utilisation

### Inviter un collaborateur

```typescript
const { inviteCollaborator } = useCollaborators();

await inviteCollaborator(
  'collaborator@example.com',
  'Jean Dupont',
  'editor'
);
```

### Vérifier les permissions

```typescript
import { PermissionGuard } from '@/components/permission-guard';

<PermissionGuard
  permission="manage_team"
  userRole={userRole}
  fallback={<p>Pas d'accès</p>}
>
  <button>Gérer l'équipe</button>
</PermissionGuard>
```

### Vérifier un rôle

```typescript
import { RoleGuard } from '@/components/permission-guard';

<RoleGuard
  requiredRole="admin"
  userRole={userRole}
  fallback={<p>Admin requis</p>}
>
  <AdminPanel />
</RoleGuard>
```

### Vérifier plusieurs permissions

```typescript
import { MultiPermissionGuard } from '@/components/permission-guard';

<MultiPermissionGuard
  permissions={['manage_deployments', 'manage_database']}
  userRole={userRole}
  mode="all"  // ou "any"
>
  <DeploymentPanel />
</MultiPermissionGuard>
```

## Structure Firestore

```
users/{userId}
├── collaborators/{collaboratorId}
│   ├── email (string)
│   ├── name (string)
│   ├── role (owner|admin|editor|reader)
│   ├── status (active|invited|pending)
│   ├── invitedAt (timestamp)
│   ├── acceptedAt (timestamp)
│   ├── invitationToken (string)
│   └── invitationExpiresAt (timestamp)
```

## À faire - Prochaines étapes

### HIGH PRIORITY
- [ ] Implémenter l'envoi d'emails d'invitation (SendGrid, Resend, etc)
- [ ] Créer une page `/accept-invitation?token=` pour accepter les invitations
- [ ] Implémenter middleware de validation des tokens d'invitation
- [ ] Ajouter protection des routes basée sur les permissions

### MEDIUM PRIORITY
- [ ] Audit log des changements de rôle
- [ ] Notifications de nouvellesinvitations
- [ ] Gestion des rôles coutumisés
- [ ] API pour accepter/refuser les invitations

### LOW PRIORITY
- [ ] Bulk actions (inviter plusieurs personnes)
- [ ] Import CSV de collaborateurs
- [ ] Historique des permissions
- [ ] SSO/SAML intégration

## Sécurité

- ✅ Validation d'email côté serveur
- ✅ Tokens d'invitation générés aléatoirement
- ✅ Expiration des tokens (24h)
- ✅ Vérification de l'ID utilisateur sur toutes les requêtes
- ⚠️ À faire: Hashage des tokens en base
- ⚠️ À faire: Rate limiting sur les invitations

## Variables d'environnement

```env
# Email (à configurer selon le service)
RESEND_API_KEY=...
SENDGRID_API_KEY=...

# Base URL pour les liens d'invitation
NEXT_PUBLIC_APP_URL=https://saasflow.example.com
```

## Notes

- Les collaborateurs invités ont un statut "invited" jusqu'à acceptation
- Une fois accepée, le statut devient "active"
- Les invitations expirent après 24h
- Les collaborateurs peuvent être supprimés et réinvités
- Les propriétaires ne peuvent pas être deleted (seulement via page settings)
