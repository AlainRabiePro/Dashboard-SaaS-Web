# 🚀 Implémentation: Système d'Invitations avec Limites par Abonnement

## ✅ Réalisations

### 1. **Service de Limites par Plan**
- Fichier: `/src/lib/subscription-service.ts`
- Définit 3 plans: Free (0), Pro (1), Enterprise (3)
- Fonctions utilitaires pour vérifier/compter les invitations

### 2. **API Génération de Lien**
- Route: `POST/GET /api/collaborators/invite-link`
- Headers: `x-user-id`, `x-project-id`
- Crée un lien unique par projet
- Stocke dans Firestore:
  - Collection privée: `users/{userId}/sites/{siteId}/inviteLinks/active`
  - Collection publique: `publicInvitations/{token}`
- Retourne: `{link, token, limit, used, remaining, isExpired}`

### 3. **Composant Partage de Lien**
- Fichier: `/src/components/ShareInvitationLink.tsx`
- Affiche barre de progression (X/3)
- Bouton "Copier le lien"
- Champ pour envoyer par email
- Gère les messages d'erreur/succès
- Désactive quand limite atteinte

### 4. **Page d'Acceptation Publique**
- Route: `/accept-invitation?token=xyz&projectId=abc`
- Pas d'authentification requise
- Formulaire complet: nom, email, mot de passe
- Crée l'utilisateur avec plan `free`
- Ajoute comme collaborateur au projet
- Incrémente le compteur
- Redirige vers le projet

### 5. **Page Collaborateurs du Projet**
- Route: `/sites/[siteId]/collaborators`
- Affiche le composant ShareInvitationLink
- Liste les collaborateurs avec statut
- Affiche le nombre d'invitations utilisées/limites

### 6. **Mise à Jour Service Email**
- Signature: `sendInvitationEmailViaResend(email, senderEmail, projectName, link)`
- Template professionnel avec:
  - Design avec dégradé
  - Nom du projet affiché
  - CTA "Accepter l'invitation"
  - Lien copié en clair
  - Note sur l'expiration

### 7. **Initialisation Utilisateur**
- Endpoint: `POST /api/init-user-space`
- Crée document utilisateur avec `subscription: {plan: 'free'}`
- Merge avec données existantes

## 📊 Flux d'Utilisation

### Administrateur
```
Site collaborateurs
    ↓
Affiche lien (ex: http://localhost:9002/accept-invitation?token=abc&projectId=xyz)
    ↓
Copie lien ou entre email
    ↓
Lien valide pour 3 acceptations
    ↓
Après 3e acceptation: "Limite atteinte"
```

### Invité
```
Reçoit email ou lien
    ↓
Visite /accept-invitation
    ↓
Crée compte (nom, email, mot de passe)
    ↓
Devient collaborateur du projet
    ↓
Compteur passe de 1/3 à 2/3, etc.
```

## 🗄️ Structure Firestore

**Collection privée**:
```
users/{userId}/sites/{siteId}/inviteLinks/active
  - token: "..."
  - siteId: "xyz"
  - siteName: "Mon Projet"
  - maxAcceptances: 3
  - acceptanceCount: 1
  - createdAt/updatedAt
```

**Collection publique**:
```
publicInvitations/{token}
  - (même structure, accès sans auth)
```

**Collaborateurs**:
```
users/{userId}/sites/{siteId}/collaborators/list
  - userId, email, name, status, role, joinedAt
```

## 🔐 Sécurité

- ✅ Token aléatoire (64 caractères)
- ✅ Pas d'authentification sur page acceptation
- ✅ Limite basée sur plan au moment de création
- ✅ Validation email/password
- ✅ Vérification limite avant création collaborateur
- ✅ Firestore security rules (à implémenter)

## 🧪 Tests à Faire

```typescript
// 1. Créer Enterprise → limit=3
await POST /api/collaborators/invite-link
// Expect: limit: 3

// 2. Accepter le lien 3 fois
// Expect: acceptanceCount passe de 0 → 1 → 2 → 3

// 3. Tentative 4e acceptation
// Expect: Error "Limite atteinte"

// 4. Envoyer par email
// Expect: Email reçu avec lien valide

// 5. Vérifier collaborateurs
await GET /api/collaborators
// Expect: 3 collaborateurs avec status: "active"
```

## 🚨 Points d'Attention

1. **Domaine email**: En test (onboarding@resend.dev), vérifier en prod
2. **Lien réutilisable**: Un seul par projet, ne pas créer de nouveau après acceptation
3. **Plan immutable**: Déterminé à la création, pas de sync si plan change
4. **Public signup**: Page acceptation n'est pas protégée = découverte possible
5. **Pagination**: Si 100+ invitations, ajouter pagination collaborateurs

## 📝 Fichiers Modifiés

```
✅ /src/lib/subscription-service.ts                 (CRÉÉ)
✅ /src/app/api/collaborators/invite-link/route.ts  (CRÉÉ)
✅ /src/components/ShareInvitationLink.tsx          (CRÉÉ)
✅ /src/app/accept-invitation/page.tsx              (CRÉÉ)
✅ /src/app/(dashboard)/sites/[siteId]/collaborators/page.tsx (CRÉÉ)
✅ /src/lib/email-service.ts                        (MODIFIÉ)
✅ /src/app/api/init-user-space/route.ts            (MODIFIÉ)
✅ /src/app/api/email/send-invitation/route.ts      (MODIFIÉ)
```

## 🔄 Prochaines Étapes

- [ ] Implémenter Firestore security rules
- [ ] Ajouter tests unitaires
- [ ] Vérifier domaine email en production
- [ ] Analytics: tracking acceptations
- [ ] Revocation: pouvoir annuler un lien
- [ ] Permissions: invitations avec rôles spécifiques
- [ ] Notifications: alerter admin quand quelqu'un accepte
- [ ] Expiration: lien valide 30 jours seulement

## ✨ Avantages pour l'Utilisateur

✅ **Simple**: Un lien, copie/partage par email
✅ **Flexible**: Jusqu'à 3 personnes (Enterprise)
✅ **Sécurisé**: Token aléatoire, pas de password sharing
✅ **Transparent**: Voir le nombre d'acceptations
✅ **Monétisé**: Les plans gratuits n'ont 0 invitations
