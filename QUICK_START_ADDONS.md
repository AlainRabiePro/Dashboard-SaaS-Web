# 🚀 Guide Rapide: Activer les Collaborateurs Payants

## 5 Minutes de Configuration

### 1️⃣ Créer le Produit Stripe (2 min)

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Cliquez **Créer un produit**
3. Remplissez:
   ```
   Nom: Team Collaborators
   Description: Invite up to 3 collaborators per project
   Type de prix: Récurrent
   Intervalle: Mensuel
   Prix: 2.00 EUR
   ```
4. Cliquez **Créer**
5. **COPIEZ le Price ID**: `price_XXXXX...` (onglet Tarification)

### 2️⃣ Configurer les Variables (2 min)

Ajoutez à `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_XXXXX...
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXX...
STRIPE_WEBHOOK_SECRET=whsec_XXXXX...
STRIPE_PRICE_COLLABORATORS_MONTHLY=price_XXXXX...
```

**Où les trouver:**
- Clés API: https://dashboard.stripe.com/developers/api-keys
- Price ID: Stripe Dashboard → Produits → Tarification
- Webhook Secret: À créer ci-dessous

### 3️⃣ Configurer le Webhook (1 min)

1. Allez à https://dashboard.stripe.com/webhooks
2. Cliquez **Ajouter un endpoint**
3. URL: `http://localhost:3000/api/webhooks/stripe` (dev)
4. Événements à ajouter:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Cliquez **Ajouter un endpoint**
6. **COPIEZ le secret**: `whsec_...` → `STRIPE_WEBHOOK_SECRET`

## 🧪 Tester Localement (2 min)

```bash
# Terminal 1: App
npm run dev

# Terminal 2: Stripe webhooks (dans le dossier du projet)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Vous verrez: "Ready! Your webhook signing secret is: whsec_..."
# Copiez ce secret → STRIPE_WEBHOOK_SECRET
```

## ✅ Vérifier que Ça Marche

1. **Sans l'add-on**:
   - Allez à `http://localhost:9002/sites/[un-site-id]/collaborators`
   - Vous devez voir: **"Débloquez les Collaborateurs"** avec paywall

2. **Simuler un paiement**:
   - Cliquez "S'abonner maintenant"
   - Stripe Checkout apparaît
   - Entrez: `4242 4242 4242 4242` (carte test)
   - Dates futures (ex: 12/28)
   - Confirmez

3. **Après paiement**:
   - Vous serez redirigé à `/sites`
   - Allez à `/sites/[id]/collaborators`
   - Vous devez voir: **Lien d'invitation partageable** 🎉

## 📝 Données de Test Stripe

**Carte réussie**:
- Numéro: `4242 4242 4242 4242`
- Exp: Toute date future (ex: 12/28)
- CVC: N'importe quel 3 chiffres (ex: 123)

**Carte déclinée**:
- Numéro: `4000 0000 0000 0002`

**Confirmation 3D Secure**:
- Numéro: `4000 0000 0000 3220`

## 🐛 Dépannage Rapide

| Problème | Solution |
|----------|----------|
| Paywall ne s'affiche pas | Vérifiez que `activeAddOns` est vide dans Firestore |
| Erreur "Price not found" | Vérifiez `STRIPE_PRICE_COLLABORATORS_MONTHLY` |
| Webhook ne se déclenche pas | Utilisez `stripe listen` dans un terminal |
| Lien n'apparaît pas après paiement | Vérifiez Firestore: `subscription.activeAddOns` |

## 🚀 Déployer en Production (10 min)

```bash
# 1. Créer les vraies clés Stripe (mode Live)
# Dashboard → Clés API → Activer le mode Live

# 2. Créer le produit en Live
# (même étapes que plus haut)

# 3. Ajouter à Vercel
vercel env add STRIPE_SECRET_KEY            # sk_live_...
vercel env add STRIPE_PUBLISHABLE_KEY       # pk_live_...
vercel env add STRIPE_WEBHOOK_SECRET        # whsec_...
vercel env add STRIPE_PRICE_COLLABORATORS_MONTHLY

# 4. Redéployer
vercel deploy --prod

# 5. Configurer le webhook production
# Stripe Dashboard → Webhooks → Ajouter
# URL: https://yourdomain.com/api/webhooks/stripe
```

## 💰 Montisation

Chaque utilisateur Free/Pro qui veut inviter des collègues paiera **2€/mois**.

Exemple:
- 100 utilisateurs Free
- 20% activent l'add-on
- 20 × 2€ = 40€/mois = 480€/an 💵

## 📞 Support

Si vous avez des questions:
1. Vérifiez [ADDONS_STRIPE_SETUP.md](ADDONS_STRIPE_SETUP.md)
2. Consultez [ENV_VARIABLES_ADDONS.md](ENV_VARIABLES_ADDONS.md)
3. Lisez [IMPLEMENTATION_PAYANT_ADDONS.md](IMPLEMENTATION_PAYANT_ADDONS.md)

---

**Vous êtes prêt!** Ça marche maintenant. 🎉
