# ✅ Implémentation: Système de Collaborateurs Payants (2€/mois)

## 🎯 Résumé de ce qui a été fait

Vous avez demandé: **"Je veux inviter que 3 personnes max et devoir payer 2€ par mois"**

### ✨ Implémentation Complète

**1. Modèle de Tarification**
- **Free**: 0 collaborateurs (sauf avec add-on)
- **Pro**: 0 collaborateurs (sauf avec add-on)
- **Enterprise**: 3 collaborateurs INCLUS (gratuit)
- **Add-on Team Collaborators**: 2€/mois pour 3 collaborateurs

**2. Flux Utilisateur**
```
User (Free/Pro) accède à /sites/[siteId]/collaborators
    ↓
Voit la section "Débloquez les Collaborateurs"
    ↓
Clique "Activer pour 2€/mois"
    ↓
Redirigé vers Stripe Checkout
    ↓
Paiement accepté
    ↓
Lien d'invitation débloqué automatiquement
    ↓
Peut inviter jusqu'à 3 personnes
```

## 📦 Fichiers Créés/Modifiés

### ✅ Créés

1. **[/src/components/CollaboratorsPaywall.tsx](src/components/CollaboratorsPaywall.tsx)**
   - Affiche le paywall "2€/mois"
   - Features incluses
   - Bouton "S'abonner"

2. **[/src/app/(dashboard)/billing/addons/collaborators/page.tsx](src/app/(dashboard)/billing/addons/collaborators/page.tsx)**
   - Page d'achat de l'add-on
   - Détails du produit
   - FAQ

3. **[/src/app/api/billing/create-addon-checkout/route.ts](src/app/api/billing/create-addon-checkout/route.ts)**
   - Crée une session Stripe checkout
   - Gère le customer Stripe
   - Retourne l'URL de paiement

4. **[/src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts)**
   - Reçoit les webhooks Stripe
   - Active/désactive les add-ons
   - Met à jour Firestore

### ✏️ Modifiés

1. **[/src/lib/subscription-service.ts](src/lib/subscription-service.ts)**
   - Ajout du concept d'add-ons
   - Nouvelle fonction `getMaxInvitations()` avec add-ons
   - `hasCollaboratorsAddOn()` pour vérifier l'activation
   - Mise à jour des limites (Free/Pro = 0, Enterprise = 3)

2. **[/src/app/api/collaborators/invite-link/route.ts](src/app/api/collaborators/invite-link/route.ts)**
   - Vérification de l'add-on avant création du lien
   - Retour 403 si add-on non actif + message "Acheter"
   - Support des `activeAddOns` dans Firestore

3. **[/src/components/ShareInvitationLink.tsx](src/components/ShareInvitationLink.tsx)**
   - Détection de l'erreur 403 (add-on manquant)
   - Affichage du composant `CollaboratorsPaywall`
   - Redirection vers page d'achat

## 🔐 Validation de l'Add-on

### API (invite-link/route.ts)
```typescript
// 1. Récupère userData avec subscription.activeAddOns
// 2. Appelle getMaxInvitations(plan, activeAddOns)
// 3. Si résultat = 0 → Retour 403 + message paywall
// 4. Si résultat > 0 → Génère le lien d'invitation
```

### Firestore Structure
```
users/{userId}
  ├─ subscription
  │   ├─ plan: 'free' | 'pro' | 'enterprise'
  │   ├─ activeAddOns: ['collaborators'] ← APRÈS paiement
  │   ├─ createdAt: Timestamp
  │   └─ updatedAt: Timestamp
  └─ stripeCustomerId: 'cus_...' ← Pour facturation
```

## 💳 Flux Stripe

### Étape 1: Initialisation (User.tsx)
```typescript
// Créer checkout session
POST /api/billing/create-addon-checkout
Headers: { 'x-user-id': userId }
Body: { addOnId: 'collaborators', returnUrl: '...' }
```

### Étape 2: Paiement (Stripe Checkout)
- Utilisateur entre ses coordonnées de paiement
- Stripe gère la transaction

### Étape 3: Activation (Webhook)
```typescript
// Stripe envoie webhook
POST /api/webhooks/stripe (avec signature)
Event: customer.subscription.created

// Backend met à jour Firestore
updateDoc(userRef, {
  'subscription.activeAddOns': ['collaborators']
})
```

### Étape 4: Déblocage (ShareInvitationLink.tsx)
```typescript
// Composant récupère le lien
GET /api/collaborators/invite-link
// Maintenant maxInvitations = 3 (au lieu de 0)
// Affiche le lien d'invitation
```

## 🧪 Tests Recommandés

### 1. User Free sans add-on
```
✓ Accède à /sites/[siteId]/collaborators
✓ Voit paywall "Débloquez les Collaborateurs"
✓ Clique "Activer pour 2€/mois"
✓ Redirigé vers Stripe Checkout
✓ Utilise carte test: 4242 4242 4242 4242
✓ Paiement réussi
✓ Webhook déclenché
✓ activeAddOns = ['collaborators']
✓ Lien d'invitation visible
✓ Peut inviter 3 personnes
```

### 2. Enterprise (inclus)
```
✓ Accède à /sites/[siteId]/collaborators
✓ Voit directement le lien d'invitation
✓ Pas de paywall
✓ Peut inviter 3 personnes sans payer
```

### 3. Annulation
```
✓ User annule l'abonnement dans Stripe
✓ Webhook customer.subscription.deleted
✓ activeAddOns = [] (vide)
✓ Lien d'invitation disparaît
✓ Paywall réapparaît
```

## 📊 Schéma de Déploiement

```
                        ┌─────────────────────────┐
                        │    Vercel (Frontend)    │
                        │                         │
      ┌─────────────────┤  /sites/[siteId]/...   │◄───────┐
      │                 │  /billing/addons/...    │        │
      │                 │  /api/...               │        │
      │                 └─────────────────────────┘        │
      │                                                      │
      │                  Checkout                            │
      │                                                      │
      ▼                                                      │
 ┌────────────────┐                  ┌──────────────────┐   │
 │  Stripe CDN    │                  │  Stripe Server   │   │
 └────────────────┘                  └──────────────────┘   │
      │                                       │              │
      │ Paiement                              │ Webhook      │
      │                                       ▼              │
      │                              ┌──────────────────┐    │
      │                              │ /api/webhooks/.. │    │
      └─────────────────────────────►│  (Met à jour)    │    │
                                     └──────────────────┘    │
                                                │             │
                                                ▼             │
                                     ┌──────────────────┐    │
                                     │  Firestore       │    │
                                     │  (activeAddOns)  │    │
                                     └──────────────────┘    │
                                                │             │
                                                └─────────────┘
```

## 🚀 Étapes de Déploiement

### 1. Configuration Locale (.env.local)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_COLLABORATORS_MONTHLY=price_...
```

### 2. Créer les Ressources Stripe
- [ ] Créer le produit "Team Collaborators"
- [ ] Obtenir le Price ID (monthly)
- [ ] Configurer le webhook

### 3. Tester Localement
```bash
# Terminal 1: App
npm run dev

# Terminal 2: Stripe Webhook
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Déclencher les événements
stripe trigger customer.subscription.created
```

### 4. Déployer
```bash
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_COLLABORATORS_MONTHLY
vercel deploy --prod
```

### 5. Configurer Webhook Production
- Allez à Stripe Dashboard → Webhooks
- Ajouter endpoint: `https://yourdomain.com/api/webhooks/stripe`
- Copier le secret → `STRIPE_WEBHOOK_SECRET` en prod

## 📚 Documentation Complète

Voir les fichiers de documentation:
- **[ADDONS_STRIPE_SETUP.md](ADDONS_STRIPE_SETUP.md)** - Configuration détaillée
- **[ENV_VARIABLES_ADDONS.md](ENV_VARIABLES_ADDONS.md)** - Variables d'environnement
- **[SUBSCRIPTION_INVITATIONS.md](SUBSCRIPTION_INVITATIONS.md)** - Système d'invitations

## 💡 Points Clés

✅ **Gratuit pour Enterprise** - Plan Enterprise inclut 3 collaborateurs
✅ **2€/mois pour Free/Pro** - Add-on Team Collaborators
✅ **Activation automatique** - Webhook Stripe met à jour Firestore
✅ **Paywall intelligent** - Affiche seulement si manque l'add-on
✅ **Flexible** - Peut s'abonner/se désabonner facilement
✅ **Scalable** - Facile d'ajouter d'autres add-ons

## ⚠️ À Faire Avant Production

- [ ] Obtenir les vraies clés Stripe (sk_live_, pk_live_)
- [ ] Créer le produit "Team Collaborators" à 2€
- [ ] Configurer le webhook en production
- [ ] Tester avec une vraie carte de crédit
- [ ] Vérifier les factures Stripe
- [ ] Monitorer les webhooks
- [ ] Configurer les alertes d'erreurs
