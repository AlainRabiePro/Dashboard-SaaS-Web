# Variables d'Environnement pour Add-ons Payants

Ajoutez les variables suivantes à votre fichier `.env.local`:

```env
# ===== STRIPE CONFIGURATION =====
# Mode: sk_test_... ou sk_live_...
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Clé publique (pour le client)
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Webhook secret (obtenu depuis Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Price IDs des add-ons (obtenir depuis Stripe Dashboard → Produits)
# Price ID pour Team Collaborators - Monthly
STRIPE_PRICE_COLLABORATORS_MONTHLY=price_XXXXXXXXXXXXX
```

## 📝 Où Obtenir Ces Valeurs

### 1. **STRIPE_SECRET_KEY** et **STRIPE_PUBLISHABLE_KEY**

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Cliquez sur **Développeurs** (en bas à gauche)
3. Sélectionnez **Clés API**
4. Copiez:
   - **Clé secrète** → `STRIPE_SECRET_KEY`
   - **Clé publique** → `STRIPE_PUBLISHABLE_KEY`

### 2. **STRIPE_PRICE_COLLABORATORS_MONTHLY**

1. Allez à **Produits → Créer un produit**
2. Remplissez les détails:
   - **Nom**: Team Collaborators
   - **Type de prix**: Récurrent
   - **Intervalle**: Mensuel
   - **Prix**: 2.00 EUR
3. Cliquez **Créer un produit**
4. Vous verrez le **Price ID**: `price_XXXXXXXXXXXXX`
5. Copiez-le dans `STRIPE_PRICE_COLLABORATORS_MONTHLY`

### 3. **STRIPE_WEBHOOK_SECRET**

1. Allez à **Webhooks** (en bas)
2. Cliquez **Ajouter un endpoint**
3. **URL de l'endpoint**: `https://yourdomain.com/api/webhooks/stripe`
4. **Événements à sélectionner**:
   ```
   ✓ customer.subscription.created
   ✓ customer.subscription.updated
   ✓ customer.subscription.deleted
   ✓ invoice.payment_succeeded
   ✓ invoice.payment_failed
   ```
5. Cliquez **Ajouter un événement** pour chacun
6. Cliquez **Créer un endpoint**
7. Vous verrez le **Secret d'endpoint**: `whsec_XXXXXXXXXXXXX`
8. Copiez-le dans `STRIPE_WEBHOOK_SECRET`

## 🚀 Déployer les Variables sur Vercel

```bash
# Ajouter chaque variable
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_COLLABORATORS_MONTHLY

# Ou via l'interface Vercel
# Allez sur votre projet → Settings → Environment Variables
```

## ✅ Vérification

Pour vérifier que tout est configuré correctement:

```bash
# Vérifier les variables (sans afficher les vraies valeurs)
vercel env list
```

## 🧪 Test Mode vs Live Mode

### Mode Test (Développement)
- **STRIPE_SECRET_KEY**: `sk_test_...`
- **STRIPE_PUBLISHABLE_KEY**: `pk_test_...`
- Utilisez les cartes de test Stripe
- Pas de vrais paiements

### Mode Live (Production)
- **STRIPE_SECRET_KEY**: `sk_live_...`
- **STRIPE_PUBLISHABLE_KEY**: `pk_live_...`
- Vrais paiements
- **ATTENTION**: Bien configurer avant de passer en production!

## 📋 Exemple Complet

```env
# Mode Test
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_PRICE_COLLABORATORS_MONTHLY=price_YOUR_PRICE_ID_HERE

# Autres variables existantes
NEXT_PUBLIC_APP_URL=http://localhost:9002
RESEND_API_KEY=re_YOUR_RESEND_KEY_HERE
# etc.
```

## 🔒 Sécurité

⚠️ **IMPORTANT**:
- Ne commitez **JAMAIS** `.env.local` dans Git
- Vérifiez que `.env.local` est dans `.gitignore`
- Les clés secrètes ne doivent jamais être exposées publiquement
- Utilisez Vercel Environment Variables pour la production

## 🆘 Problèmes Courants

| Problème | Solution |
|----------|----------|
| `API key is invalid` | Vérifiez `STRIPE_SECRET_KEY` |
| `Price not found` | Vérifiez `STRIPE_PRICE_COLLABORATORS_MONTHLY` |
| Webhook ne se déclenche pas | Vérifiez `STRIPE_WEBHOOK_SECRET` |
| Erreur CORS en paiement | Configurez les URLs autorisées dans Stripe Dashboard |
