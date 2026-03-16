# 🎯 Système d'Invitations Partagées par Abonnement

## Résumé

Implémentation d'un système d'invitations partagées basé sur les plans d'abonnement:
- **Free**: 0 invitations
- **Pro**: 1 invitation
- **Enterprise**: 3 invitations par projet

## Architecture

### 1. Service d'Abonnement (`/src/lib/subscription-service.ts`)
Définit les limites par plan et les fonctions utilitaires:
```typescript
- getLimitsForPlan(plan): Récupère les limites pour un plan
- canInviteMore(plan, count): Vérifie si on peut inviter plus
- getRemainingSlots(plan, count): Nombre de places restantes
```

### 2. API Lien d'Invitation (`/src/app/api/collaborators/invite-link/route.ts`)

#### POST - Créer/Obtenir un lien
- **Headers**: `x-user-id`, `x-project-id`
- **Response**:
```json
{
  "link": "http://localhost:9002/accept-invitation?token=xyz&projectId=abc",
  "token": "xyz...",
  "limit": 3,
  "used": 1,
  "remaining": 2,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Logique**:
1. Récupère le plan d'abonnement de l'utilisateur
2. Obtient les limites depuis le service
3. Crée ou réutilise un lien existant
4. Stocke dans:
   - `users/{userId}/sites/{siteId}/inviteLinks/active`
   - `publicInvitations/{token}` (pour accès public)

#### GET - Récupérer un lien existant
- **Headers**: `x-user-id`, `x-project-id`
- **Response**: Même format que POST
- **Note**: Renvoie `isExpired: true` si `acceptanceCount >= maxAcceptances`

### 3. Composant ShareInvitationLink (`/src/components/ShareInvitationLink.tsx`)

**Fonctionnalités**:
- ✅ Affiche le statut des invitations (X/3)
- ✅ Barre de progression
- ✅ Bouton "Copier le lien"
- ✅ Champ email + bouton "Envoyer par email"
- ✅ Message d'erreur si limite atteinte
- ✅ Feedback utilisateur après envoi

**Props**:
```typescript
{
  projectId: string;
  projectName: string;
}
```

### 4. Page d'Acceptation (`/src/app/accept-invitation/page.tsx`)

**Route**: `/accept-invitation?token=xyz&projectId=abc`
**Public**: Oui (pas d'authentification requise)

**Étapes**:
1. Récupère l'invitation depuis `publicInvitations/{token}`
2. Vérifie que la limite n'est pas atteinte
3. Formulaire de création de compte:
   - Nom complet
   - Email
   - Mot de passe (6+ caractères)
4. Crée l'utilisateur Firebase
5. Ajoute comme collaborateur au projet
6. Incrémente le compteur d'acceptations
7. Redirige vers le projet

**Validations**:
- Lien expiré → Message d'erreur
- Limite atteinte → Message d'erreur
- Mot de passe trop court → Erreur
- Email déjà utilisé → Erreur Firebase

### 5. Page Collaborateurs du Projet (`/src/app/(dashboard)/sites/[siteId]/collaborators/page.tsx`)

**Route**: `/sites/[siteId]/collaborators`
**Affichage**:
- Lien d'invitation partageable (composant ShareInvitationLink)
- Liste des collaborateurs actuels
- Statut (Actif/En attente)

### 6. Mise à Jour du Service Email (`/src/lib/email-service.ts`)

**Signature mise à jour**:
```typescript
sendInvitationEmailViaResend(
  email: string,
  senderEmail: string,
  projectName: string,
  invitationLink: string
): Promise<boolean>
```

**Template amélioré**:
- Design professionnel avec dégradé
- Affiche le nom du projet
- CTA clair "Accepter l'invitation"
- Affiche le lien pour copie manuelle
- Note sur l'expiration basée sur le plan

## Flux Utilisateur

### Administrateur invitant
1. Va à `/sites/[siteId]/collaborators`
2. Voit la section "Lien d'invitation partageable"
3. Affiche le statut "0/3 invitations utilisées"
4. Peut **Copier le lien** ou **Envoyer par email**
5. Lien reste valide jusqu'à 3 acceptations
6. Après 3 acceptations: "Limite atteinte" + lien disabled

### Invité acceptant
1. Reçoit email ou copie le lien
2. Visite `/accept-invitation?token=xyz&projectId=abc`
3. Remplit le formulaire d'inscription
4. Crée son compte
5. Est automatiquement ajouté comme collaborateur
6. Redirigé vers le projet

## Structure Firestore

### Collection Privée (par utilisateur)
```
users/{userId}/sites/{siteId}/inviteLinks/
  └─ active
      ├─ token: "abc123..."
      ├─ siteId: "site1"
      ├─ siteName: "Mon Projet"
      ├─ ownerId: "user123"
      ├─ maxAcceptances: 3
      ├─ acceptanceCount: 1
      ├─ createdAt: Timestamp
      └─ updatedAt: Timestamp
```

### Collection Publique (accès sans auth)
```
publicInvitations/{token}
  ├─ token: "abc123..."
  ├─ siteId: "site1"
  ├─ siteName: "Mon Projet"
  ├─ ownerId: "user123"
  ├─ maxAcceptances: 3
  ├─ acceptanceCount: 1
  ├─ createdAt: Timestamp
  └─ updatedAt: Timestamp
```

### Collaborateurs avec status
```
users/{userId}/sites/{siteId}/collaborators/
  └─ list
      ├─ userId: "new_user_id"
      ├─ email: "user@example.com"
      ├─ name: "John Doe"
      ├─ status: "active" | "invited"
      ├─ role: "collaborator" | "admin"
      └─ joinedAt: Timestamp
```

## Variables d'Environnement Requises

```env
NEXT_PUBLIC_APP_URL=http://localhost:9002  # URL de base pour les liens
RESEND_API_KEY=re_...                      # Clé API Resend
```

## Erreurs Gérées

| Erreur | Cause | Solution |
|--------|-------|----------|
| `LIMIT_EXCEEDED` | 3 invitations acceptées | Affiche "Limite atteinte" |
| `INVALID_TOKEN` | Token expiré/invalide | Affiche "Lien invalide" |
| `EMAIL_ALREADY_USED` | Email existe | Propose au/à l'utilisateur de se connecter |
| `WEAK_PASSWORD` | < 6 caractères | Message de validation |
| `INVALID_EMAIL` | Format invalide | Message de validation |
| `SEND_EMAIL_FAILED` | API Resend down | Affiche erreur avec retry |

## Tests Recommandés

1. **Création de lien**:
   - Créer un Enterprise → Lien avec limit=3
   - Créer un Pro → Lien avec limit=1
   - Créer un Free → Pas de lien (limit=0)

2. **Acceptation**:
   - Accepter avec nouveau compte → Ajouter comme collaborateur
   - Accepter 3 fois → 4ème acceptation échoue

3. **Email**:
   - Envoyer par email → Reçoit le lien
   - Lien dans email cliquable → Ouvre page d'acceptation

4. **Limite**:
   - Vérifier progression (X/3) après chaque acceptation
   - "Limite atteinte" après 3 acceptations
   - Bouton disabled après limite

## Cas d'Usage Futurs

- [ ] Invitations avec permissions spécifiques
- [ ] Expiration de lien après X jours
- [ ] Historique des acceptations
- [ ] Revocation des invitations
- [ ] Renvoi du lien par email
- [ ] Analytics sur les invitations acceptées

## Notes Importantes

1. **Lien réutilisable**: Un seul lien par projet, réutilisable pour plusieurs acceptations
2. **Pas d'authentification**: Page d'acceptation publique = permet découverte
3. **Sécurité**: Token aléatoire de 64 caractères (32 bytes en hex)
4. **Email**: Utilise Resend, domaine à vérifier en production
5. **Plan**: Déterminé au moment de la génération du lien, pas de sync ultérieure
