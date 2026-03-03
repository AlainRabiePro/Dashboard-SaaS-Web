# Support des Multiples Bases de Données Firestore

## Vue d'ensemble

Le système SaasFlow supporte maintenant **plusieurs bases de données Firestore** par utilisateur. Cela permet aux utilisateurs de gérer plusieurs projets Firestore à partir d'une seule interface.

## Architecture

### Composants

1. **`/src/lib/multi-database-service.ts`**
   - Service centralisé pour gérer les connexions aux multiples bases
   - Cache les instances Firestore pour éviter les réinitialisations répétées
   - Récupère les configurations depuis la base principale

2. **`/src/app/api/databases/route.ts`**
   - API REST pour gérer les bases de données utilisateur
   - Supports: GET (liste), POST (créer), PUT (mettre à jour), DELETE (supprimer)
   - Validation des configurations Firestore
   - Gestion automatique de la base par défaut

3. **`/src/app/api/get-firestore-data/route.ts`**
   - API pour récupérer les données d'une base de données
   - Support du paramètre `?databaseId=` pour spécifier la base
   - Fallback sur la base par défaut si non spécifié
   - Connexion dynamique basée sur la configuration de l'utilisateur

4. **`/src/components/database-manager.tsx`**
   - Composant UI pour gérer les connexions
   - Ajouter une nouvelle base de données
   - Définir une base par défaut
   - Supprimer une base de données

5. **`/src/app/(dashboard)/database/page.tsx`**
   - Page Firestore Explorer améliorée
   - Sélection de la base de données
   - Affichage des collections de la base sélectionnée

## Structure de Données Firestore

```firestore
databases/
├── {databaseId}
│   ├── userId: string
│   ├── name: string
│   ├── isDefault: boolean
│   ├── config: {
│   │   ├── apiKey: string
│   │   ├── authDomain: string
│   │   ├── projectId: string
│   │   ├── storageBucket: string
│   │   ├── messagingSenderId: string
│   │   └── appId: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

## Comment l'utiliser

### Pour l'utilisateur

1. **Ajouter une nouvelle base de données**
   - Cliquer sur le bouton "Gérer" dans le Firestore Explorer
   - Cliquer sur "Ajouter une base de données"
   - Remplir les champs de configuration Firebase
   - La première base ajoutée devient automatiquement la base par défaut

2. **Changer de base de données**
   - Utiliser le sélecteur "Sélectionner une base de données"
   - Les collections de la base sélectionnée s'affichent automatiquement

3. **Définir une base par défaut**
   - Ouvrir le gestionnaire de bases
   - Cliquer sur "Définir par défaut" sur la base désirée

4. **Supprimer une base**
   - Ouvrir le gestionnaire de bases
   - Cliquer sur l'icône poubelle
   - Confirmer la suppression

### Pour les développeurs

#### Récupérer les données d'une base spécifique

```typescript
const response = await fetch(`/api/get-firestore-data?databaseId={databaseId}`, {
  headers: {
    'x-user-id': userId,
  }
});
const data = await response.json();
```

#### Utiliser le service multi-database

```typescript
import { multiDatabaseService } from '@/lib/multi-database-service';

// Récupérer une base de données
const firestore = await multiDatabaseService.getDatabase(databaseId);

// Récupérer toutes les bases d'un utilisateur
const databases = await multiDatabaseService.getUserDatabases(userId);

// Récupérer la base par défaut
const defaultDb = await multiDatabaseService.getDefaultDatabase(userId);

// Nettoyer le cache
multiDatabaseService.clearCache(databaseId);
```

## Sécurité

- Les configurations Firestore sont stockées de manière **sécurisée** dans la base principale
- Les clés API doivent avoir les **restrictions appropriées** dans Firebase Console
- Chaque utilisateur peut uniquement accéder à ses propres bases de données
- Les accès sont validés côté serveur via `x-user-id` header

## Limitations

- Une seule base de données peut être définie par défaut
- Les configurations Firestore doivent être valides et accessibles
- Les clients doivent avoir les permissions appropriées dans Firestore

## Améliorations futures

- [ ] Synchronisation en temps réel des collections
- [ ] Support de Cloud Storage multiple
- [ ] Import/Export de configurations
- [ ] Historique des connexions
- [ ] Tests de connexion avant sauvegarde
- [ ] Limitations de requêtes par base
