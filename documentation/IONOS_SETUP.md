# 🚀 Configuration IONOS pour Revente de Domaines

## 1️⃣ **Créer/Configurer votre compte IONOS**

### A. Créer un compte Business IONOS
1. Allez à https://www.ionos.fr
2. Cliquez **Revendeur** ou **Business**
3. Créez votre compte
4. **Achetez au minimum 1 domaine** (obligatoire pour l'API)

### B. Accéder à la console développeur
1. Allez à https://developer.ionos.com
2. Cliquez **Login** avec vos identifiants IONOS
3. Allez à **Settings** → **API Keys** (ou **Applications**)

---

## 2️⃣ **Obtenir vos API Credentials**

### Créer une nouvelle clé API:
1. Cliquez **Create API Key** ou **New Application**
2. Donnez un nom: `Domain Reselling App`
3. Sélectionnez les permissions:
   - ✅ **Domains**
   - ✅ **Orders**
   - ✅ **Read**
   - ✅ **Write**
4. Cliquez **Create**

### Récupérer vos identifiants:
Vous verrez deux valeurs:
```
Client ID: xxxxxxxxxxxxxxxxxxxxx
Client Secret: xxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANT:** Copiez ces deux valeurs immédiatement! Le Secret ne s'affiche qu'une fois.

---

## 3️⃣ **Configurer votre `.env.local`**

À la racine de votre projet, créez/modifiez `.env.local`:

```env
# === STRIPE (Paiement avec clients) ===
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# === IONOS (Enregistrement domaines automatique) ===
DOMAIN_REGISTRAR=ionos
IONOS_API_KEY=xxxxxxxxxxxxxxxxxxxxx
IONOS_API_SECRET=xxxxxxxxxxxxxxxxxxxxx

# === Firebase (Votre base de données) ===
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxx

# === APP ===
NEXT_PUBLIC_APP_URL=https://votresite.com
```

**Exemple complet:**
```env
DOMAIN_REGISTRAR=ionos
IONOS_API_KEY=12345abcdef67890ghijkl
IONOS_API_SECRET=zyxwvutsrqponmlkjihgfedcba98765
STRIPE_SECRET_KEY=sk_live_abcd1234efgh5678
STRIPE_WEBHOOK_SECRET=whsec_test_abcd1234
```

---

## 4️⃣ **Configurer le Webhook Stripe**

Pour que le paiement déclenche automatiquement l'enregistrement du domaine:

1. Allez [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** → **Webhooks**
3. **Add endpoint:**
   - URL: `https://votresite.com/api/webhooks/domains`
   - Événement: `checkout.session.completed`
4. Copiez le **Signing Secret** → Mettez dans `.env.local`

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 5️⃣ **Tester le système**

### A. Localement (mode développement)

**Option 1: Utiliser Stripe CLI**
```bash
# Installer Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhooks/domains
# Récupérez le webhook secret
```

**Option 2: Mode test (sans paiement réel)**
```env
DOMAIN_REGISTRAR=mock  # Simuler IONOS
STRIPE_SECRET_KEY=sk_test_xxxxx  # Clé test Stripe
```

### B. Test end-to-end

1. Allez sur votre site de revente
2. Cherchez un domaine (ex: `test.fr`)
3. Cliquez **Commander**
4. Complétez le **paiement Stripe** (utilisez la carte test: `4242 4242 4242 4242`)
5. **Vérifiez:**
   - ✅ Firestore: Commande marquée `paid`
   - ✅ IONOS: Domaine enregistré dans votre compte
   - ✅ Email: Client reçoit confirmation

---

## 6️⃣ **Architecture du flux automatisé**

```
Client cherche domaine
        ↓
   Paie sur Stripe
        ↓
   Webhook Stripe reçoit confirmation
        ↓
   Appel API IONOS pour enregistrer
        ↓
   Domaine créé dans votre compte IONOS
        ↓
   Client reçoit email de confirmation
        ↓
   ✅ Domaine lui appartient!
```

---

## 7️⃣ **Gestion des domaines après vente**

Une fois enregistré, le client peut:
- Gérer les DNS via votre app
- Renouveler via votre app
- Transférer si besoin

### Dans votre app (à implémenter):
- Page **"Mes domaines"** - Affiche tous ses domaines
- Page **"Gestion DNS"** - Édite les DNS (via IONOS API)
- Page **"Renouvellement"** - Renouvelle automatiquement

---

## ❓ **Troubleshooting**

### ❌ "IONOS authentication failed"
→ Vérifiez `IONOS_API_KEY` et `IONOS_API_SECRET` dans `.env.local`

### ❌ "Domain not available"
→ Le domaine est peut-être déjà pris

### ❌ Webhook ne reçoit rien
→ Utilisez **Stripe CLI** pour tester localement

### ❌ "Insufficient balance"
→ Votre compte IONOS n'a pas assez de crédit

---

## ✅ **Checklist finale**

- [ ] Compte IONOS créé (Business/Revendeur)
- [ ] Au minimum 1 domaine acheté chez IONOS
- [ ] API Key créée et notée
- [ ] API Secret créée et notée
- [ ] `.env.local` configuré avec `IONOS_API_KEY` et `IONOS_API_SECRET`
- [ ] `.env.local` a `STRIPE_WEBHOOK_SECRET`
- [ ] Webhook Stripe configuré
- [ ] `DOMAIN_REGISTRAR=ionos` dans `.env.local`
- [ ] Test local avec Stripe CLI réussi

---

## 🚀 **Vous êtes prêt!**

Votre système est maintenant **100% automatisé** avec IONOS!

Quand un client paie:
1. Stripe confirme le paiement
2. Webhook appelle IONOS
3. Domaine enregistré automatiquement
4. Client reçoit les détails

**Pas d'action manuelle requise!** 🎉
