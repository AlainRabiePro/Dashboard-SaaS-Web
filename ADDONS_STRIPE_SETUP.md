# 💳 Configuration des Add-ons Payants avec Stripe

## 🎯 Fonctionnalité

Système d'add-ons payants pour débloquer des collaborateurs:
- **Free**: 0 collaborateurs (à moins d'acheter l'add-on)
- **Pro**: 0 collaborateurs (à moins d'acheter l'add-on)
- **Enterprise**: 3 collaborateurs inclus (pas besoin d'add-on)

## 💰 Add-on Team Collaborators

**Prix**: 2€ par mois
**Avantages**:
- 3 collaborateurs par projet
- Liens d'invitation partageable
- Gestion des permissions
- Invitations par email

## 📋 Configuration Requise

### 1. **Stripe API Keys** (.env.local)

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_... ou sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_... ou pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Prix Stripe (à créer dans Stripe Dashboard)
STRIPE_PRICE_COLLABORATORS_MONTHLY=price_...
```

### 2. **Créer les Produits Stripe**

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Allez à **Produits → Créer un produit**
3. **Nom**: `Team Collaborators`
4. **Description**: `Invite up to 3 collaborators per project`
5. **Type de prix**: Récurrent
6. **Intervalle de facturation**: Mensuel
7. **Prix**: 2.00 EUR
8. **Sauvegardez le Price ID**: `price_...`

### 3. **Configurer le Webhook Stripe**

1. Allez à **Webhooks → Ajouter un endpoint**
2. **URL**: `https://yourdomain.com/api/webhooks/stripe`
3. **Événements à sélectionner**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copiez le secret**: `whsec_...`

### 4. **Déployer sur Vercel**

```bash
# Ajouter les variables d'environnement
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_COLLABORATORS_MONTHLY

# Redéployer
vercel deploy --prod
```

## 🔄 Flux d'Activation

### Utilisateur (Free/Pro)

```
Accède à /sites/[siteId]/collaborators
    ↓
Clique sur "Débloquez les Collaborateurs"
    ↓
Voit le paywall "2€/mois"
    ↓
Clique "S'abonner maintenant"
    ↓
Redirigé vers Stripe Checkout
    ↓
Entre ses coordonnées de paiement
    ↓
Paiement réussi → Webhook Stripe
    ↓
Add-on activé dans Firestore
    ↓
Redirigé vers /sites
    ↓
Peut maintenant inviter 3 collaborateurs
```

### Backend (Webhook)

```
Stripe envoie l'événement
    ↓
webhook /api/webhooks/stripe reçoit
    ↓
Vérifie la signature
    ↓
Si customer.subscription.created:
    - Ajoute 'collaborators' à activeAddOns
    ↓
Si customer.subscription.deleted:
    - Retire 'collaborators' de activeAddOns
    ↓
Utilisateur peut/ne peut plus inviter
```

## 📊 Structure Firestore (mise à jour)

```typescript
users/{userId}
  ├─ subscription
  │   ├─ plan: 'free' | 'pro' | 'enterprise'
  │   ├─ activeAddOns: ['collaborators'] // Array d'add-ons actifs
  │   ├─ createdAt: Timestamp
  │   └─ updatedAt: Timestamp
  └─ stripeCustomerId: 'cus_...'
```

## 🔐 Vérification des Droits

### API Invite Link

```typescript
// 1. Récupère le plan: 'free'
// 2. Récupère activeAddOns: ['collaborators'] ou []
// 3. Appelle getMaxInvitations('free', ['collaborators'])
//    → Retourne 3 si l'add-on est actif, 0 sinon
// 4. Si 0: Retour 403 + paywall
// 5. Si > 0: Génère le lien
```

### Composant ShareInvitationLink

```typescript
if (response.status === 403) {
  // Affiche CollaboratorsPaywall
  // Utilisateur clique "S'abonner"
  // Redirige vers /billing/addons/collaborators
}
```

## 💡 Exemple d'Utilisation

### Cas 1: Utilisateur Free, sans add-on
```
User: {
  subscription: { plan: 'free', activeAddOns: [] }
}

Appel: getMaxInvitations('free', [])
→ Retourne: 0
→ API retourne: 403 Forbidden + "Acheter l'add-on"
```

### Cas 2: Utilisateur Free, avec add-on
```
User: {
  subscription: { plan: 'free', activeAddOns: ['collaborators'] }
}

Appel: getMaxInvitations('free', ['collaborators'])
→ Retourne: 3
→ API retourne: 200 OK + lien valide pour 3 acceptations
```

### Cas 3: Utilisateur Enterprise (inclus)
```
User: {
  subscription: { plan: 'enterprise', activeAddOns: [] }
}

Appel: getMaxInvitations('enterprise', [])
→ Retourne: 3
→ API retourne: 200 OK + lien valide pour 3 acceptations
```

## 🧪 Tests

### En Mode Test (Stripe)

1. **Cartes de test Stripe**:
   - Succès: `4242 4242 4242 4242`
   - Déclinée: `4000 0000 0000 0002`
   - 3D Secure: `4000 0000 0000 3220`

2. **Tester le webhook localement**:
   ```bash
   # Installer Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Se connecter
   stripe login
   
   # Forwarder les webhooks localement
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   
   # Dans un autre terminal, déclencher un événement
   stripe trigger customer.subscription.created
   ```

### Vérifier l'Activation

```bash
# Aller dans Firestore
# Éditer l'utilisateur
# Ajouter: subscription.activeAddOns = ['collaborators']
# Rafraîchir la page collaborateurs
# Le lien doit apparaître
```

## 🚨 Dépannage

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Payment service not configured` | `STRIPE_SECRET_KEY` manquant | Ajouter la clé dans .env.local |
| `403 Forbidden: Not authorized` | Add-on pas actif | L'utilisateur doit s'abonner d'abord |
| `Invalid Price ID` | `STRIPE_PRICE_COLLABORATORS_MONTHLY` incorrect | Vérifier le Price ID dans Stripe Dashboard |
| Webhook ne se déclenche pas | Secret invalide | Copier le nouveau secret de Stripe |

## 📝 Fichiers Modifiés/Créés

```
✅ /src/lib/subscription-service.ts              (MODIFIÉ - ajout add-ons)
✅ /src/app/api/collaborators/invite-link/route.ts (MODIFIÉ - vérification add-ons)
✅ /src/components/ShareInvitationLink.tsx       (MODIFIÉ - affichage paywall)
✅ /src/components/CollaboratorsPaywall.tsx      (CRÉÉ - composant paywall)
✅ /src/app/(dashboard)/billing/addons/collaborators/page.tsx (CRÉÉ)
✅ /src/app/api/billing/create-addon-checkout/route.ts (CRÉÉ)
✅ /src/app/api/webhooks/stripe/route.ts        (CRÉÉ)
```

## ✨ Avantages

✅ **Monétisation simple**: 2€/mois pour débloquer une feature
✅ **Transparent**: Utilisateurs savent exactement ce qu'ils paient
✅ **Flexible**: Peut s'abonner/se désabonner n'importe quand
✅ **Scalable**: Facile d'ajouter d'autres add-ons
✅ **Sécurisé**: Stripe gère les paiements

## 🔮 Améliorations Futures

- [ ] Tableau de bord des add-ons actifs
- [ ] Historique de facturation
- [ ] Factures PDF
- [ ] Notifications de renouvellement
- [ ] Promotions/codes promo
- [ ] Essai gratuit 7 jours
- [ ] Add-ons supplémentaires (stockage, domaines, etc.)
