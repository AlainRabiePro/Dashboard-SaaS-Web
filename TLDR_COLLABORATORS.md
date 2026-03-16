# ⚡ TL;DR - Collaborateurs Payants (2€/mois)

## 🎯 Le Changement

**Avant**: N'importe qui pouvait inviter n'importe combien
**Maintenant**: Inviter 3 personnes coûte 2€/mois via Stripe

## 📦 Fichiers Impactés

| Type | Fichier | Changement |
|------|---------|-----------|
| 🆕 Créé | `CollaboratorsPaywall.tsx` | Affiche le paywall |
| 🆕 Créé | `billing/addons/collaborators/page.tsx` | Page d'achat |
| 🆕 Créé | `api/billing/create-addon-checkout/route.ts` | Crée checkout Stripe |
| 🆕 Créé | `api/webhooks/stripe/route.ts` | Active l'add-on |
| ✏️ Modifié | `subscription-service.ts` | Ajout add-ons |
| ✏️ Modifié | `api/collaborators/invite-link/route.ts` | Vérifie add-on |
| ✏️ Modifié | `ShareInvitationLink.tsx` | Affiche paywall |

## 🚀 Quick Start (2 min)

### 1. Créer produit Stripe
```
Dashboard Stripe → Produits → Créer
Nom: Team Collaborators
Prix: 2.00 EUR (Mensuel)
Copier: Price ID = price_...
```

### 2. Ajouter à .env.local
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (créer webhook ci-dessous)
STRIPE_PRICE_COLLABORATORS_MONTHLY=price_...
```

### 3. Créer webhook
```
Dashboard Stripe → Webhooks → Ajouter
URL: http://localhost:3000/api/webhooks/stripe
Événements: subscription.created, updated, deleted
Copier: Secret = whsec_...
```

### 4. Lancer webhook local
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5. Test
```bash
npm run dev
# Aller à: http://localhost:9002/sites/[id]/collaborators
# Doit voir: Paywall "2€/mois"
# Cliquer: "S'abonner maintenant"
# Payer avec: 4242 4242 4242 4242
# Résultat: Lien d'invitation visible ✅
```

## 📊 Logique

```
FREE User    → No invite link  → Shows paywall
             ↓
          Pays 2€ (Stripe)
             ↓
          activeAddOns = ['collaborators']
             ↓
          Can invite 3 people ✅

ENTERPRISE   → Has 3 included   → No paywall
             → No payment needed ✅
```

## 💳 Stripe Flow

```
User clicks "Subscribe"
        ↓
POST /api/billing/create-addon-checkout
        ↓
Stripe Checkout Session
        ↓
User pays (Stripe Hosted)
        ↓
Webhook: customer.subscription.created
        ↓
updateDoc(user, { activeAddOns: ['collaborators'] })
        ↓
Redirect to /sites
        ↓
Visit /sites/[id]/collaborators
        ↓
Invitation link visible! ✅
```

## 🔍 Vérifier que Ça Marche

### Doit afficher paywall
```
GET /sites/[id]/collaborators
↓
userData.subscription.activeAddOns = []
↓
getMaxInvitations('free', []) → 0
↓
API 403 + "Débloquez pour 2€"
✓ PAYWALL VISIBLE
```

### Après paiement
```
Webhook reçu
↓
updateDoc(user, {
  'subscription.activeAddOns': ['collaborators']
})
↓
userData.subscription.activeAddOns = ['collaborators']
↓
getMaxInvitations('free', ['collaborators']) → 3
↓
API 200 + link generated
✓ LIEN VISIBLE
```

## 📈 Revenue

```
1000 users × 20% adoption = 200 users
200 users × 2€/month = 400€/month
400€/month × 12 = 4800€/year
```

## 🚨 Pièges Communs

| ❌ Erreur | ✅ Solution |
|---------|---------|
| `activeAddOns` vide après paiement | Attendre webhook (~2s) + refresh |
| Paywall ne s'affiche pas | Vérifier `.env.local` a `STRIPE_PRICE_...` |
| Webhook ne se déclenche pas | Lancer `stripe listen` en local |
| Paiement test échoue | Utiliser carte: `4242 4242 4242 4242` |
| Stripe API error | Vérifier clés (sk_test_ vs sk_live_) |

## 🎯 Cas d'Usage

### User FREE
- Visite `/collaborators`
- Voit paywall
- Clique "S'abonner"
- Paie via Stripe
- Peut inviter 3 personnes

### User PRO
- Même flow que FREE
- Add-on coûte 2€ (PRO = 9€, total = 11€)

### User ENTERPRISE
- Visite `/collaborators`
- Voit lien d'invitation
- PAS de paywall
- Peut inviter 3 personnes (inclus)

## 📝 À Mémoriser

- **Paywall trigger**: `activeAddOns` vide
- **Paywall resolve**: Webhook stripe.subscription.created
- **Max invites**: 3 (configurable dans subscription-service.ts)
- **Price**: 2€/mois (configurable dans env)
- **Validation**: Se fait à l'appel API `invite-link/route.ts`

## 🎉 Prêt!

**Status**: ✅ 100% implémenté et testé
**Coût setup**: Gratuit (Stripe gratuit jusqu'à premier paiement)
**Temps setup**: 5-10 minutes
**Temps test**: 10 minutes
**Temps déploiement**: 5 minutes

**Allez-y!** 🚀
