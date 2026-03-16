# ✅ CHECKLIST DE DÉPLOIEMENT

## Phase 1: Configuration Locale (5 min)

### Stripe Setup
- [ ] Créer compte Stripe (https://stripe.com)
- [ ] Créer produit "Team Collaborators"
  - [ ] Nom: Team Collaborators
  - [ ] Prix: 2.00 EUR
  - [ ] Type: Récurrent Mensuel
  - [ ] Copier Price ID
- [ ] Obtenir les clés API
  - [ ] STRIPE_SECRET_KEY (sk_test_...)
  - [ ] STRIPE_PUBLISHABLE_KEY (pk_test_...)
- [ ] Créer webhook
  - [ ] URL: http://localhost:3000/api/webhooks/stripe
  - [ ] Événements:
    - [ ] customer.subscription.created
    - [ ] customer.subscription.updated
    - [ ] customer.subscription.deleted
    - [ ] invoice.payment_succeeded
    - [ ] invoice.payment_failed
  - [ ] Copier Secret (whsec_...)

### .env.local
- [ ] Ajouter 4 variables:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_COLLABORATORS_MONTHLY=price_...
```

### Webhooks Locaux
- [ ] Installer Stripe CLI: `brew install stripe/stripe-cli/stripe`
- [ ] Lancer: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] Copier le secret affiché → `STRIPE_WEBHOOK_SECRET`

## Phase 2: Tests Locaux (10 min)

### App
- [ ] `npm run dev` (app tourne sur localhost:9002)
- [ ] Accéder à: `http://localhost:9002/sites/[any-site-id]/collaborators`
- [ ] Vérifier: Paywall affiché avec "Débloquez pour 2€/mois"

### Paiement Test
- [ ] Cliquer "S'abonner maintenant"
- [ ] Stripe Checkout s'ouvre
- [ ] Remplir:
  - [ ] Email: anything@example.com
  - [ ] Carte: 4242 4242 4242 4242
  - [ ] Exp: 12/28 (ou future)
  - [ ] CVC: 123
- [ ] Cliquer "Payer"

### Vérifications Post-Paiement
- [ ] Redirection vers /sites
- [ ] Retour à `/sites/[id]/collaborators`
- [ ] **Lien d'invitation visible** ✅
- [ ] Barre de progression "0/3"
- [ ] Bouton "Copier lien"
- [ ] Champ email pour partager

### Vérifier Firestore
- [ ] Aller dans Firestore Console
- [ ] `users/{test-user-id}`
- [ ] Vérifier: `subscription.activeAddOns = ['collaborators']` ✅

### Vérifier Webhook
- [ ] Terminal Stripe CLI
- [ ] Doit afficher: `✓ customer.subscription.created`
- [ ] Logs app: `✅ Add-on collaborators activated`

## Phase 3: Test de Limites (5 min)

### Inviter 3 Personnes
- [ ] Accepter invitation 1x → Compte 1/3 ✅
- [ ] Accepter invitation 2x → Compte 2/3 ✅
- [ ] Accepter invitation 3x → Compte 3/3 ✅
- [ ] Tentative 4x → Erreur "Limite atteinte" ✅

### Annulation
- [ ] Aller Stripe Dashboard
- [ ] Annuler la souscription
- [ ] Attendre webhook `customer.subscription.deleted`
- [ ] Retour à app
- [ ] Aller à `/sites/[id]/collaborators`
- [ ] **Paywall réapparaît** ✅

## Phase 4: Production Setup (15 min)

### Créer Clés Stripe Live
- [ ] Stripe Dashboard → Mode Live
- [ ] Créer nouveau produit en mode Live
  - [ ] Même prix (2.00 EUR)
  - [ ] Copier Price ID (mode Live)
- [ ] Obtenir clés Live
  - [ ] STRIPE_SECRET_KEY (sk_live_...)
  - [ ] STRIPE_PUBLISHABLE_KEY (pk_live_...)

### Vercel Environment Variables
- [ ] `vercel env add STRIPE_SECRET_KEY` → sk_live_...
- [ ] `vercel env add STRIPE_PUBLISHABLE_KEY` → pk_live_...
- [ ] `vercel env add STRIPE_WEBHOOK_SECRET` → whsec_...
- [ ] `vercel env add STRIPE_PRICE_COLLABORATORS_MONTHLY` → price_live_...

### Stripe Webhook Production
- [ ] Stripe Dashboard → Webhooks → Ajouter
- [ ] URL: https://yourdomain.com/api/webhooks/stripe
- [ ] Sélectionner mêmes événements
- [ ] Copier secret → Ajouter à Vercel

### Redéployer
- [ ] `vercel deploy --prod`
- [ ] Vérifier: Variables sont configurées
- [ ] Vérifier: App accessible

### Test Production
- [ ] Accéder à https://yourdomain.com
- [ ] Naviguer à `/sites/[id]/collaborators`
- [ ] Vérifier paywall
- [ ] **NE PAS TESTER AVEC VRAIE CARTE POUR MAINTENANT**
  - [ ] Utiliser la version test d'abord
  - [ ] Ou contacter Stripe Support

## Phase 5: Monitoring & Analytics (Continu)

### Dashboards à Suivre
- [ ] Stripe Dashboard:
  - [ ] Revenue MRR
  - [ ] Nombre de subscriptions
  - [ ] Taux de churn
  - [ ] Déclines de paiement

- [ ] Firestore:
  - [ ] Nombre d'utilisateurs avec activeAddOns
  - [ ] Nombre de liens créés
  - [ ] Acceptations de collaborateurs

- [ ] Analytics:
  - [ ] Taux de conversion (Free → Payant)
  - [ ] CAC (Coût d'acquisition)
  - [ ] LTV (Valeur vie client)

### Alertes à Configurer
- [ ] Si webhook échoue (Stripe Dashboard)
- [ ] Si Firestore rétourne erreur (Firebase Console)
- [ ] Si taux de paiement échoué > 5% (Stripe)

## 🚨 Troubleshooting

### Paywall ne s'affiche pas
- [ ] Vérifier: `.env.local` a STRIPE_PRICE...
- [ ] Vérifier: `activeAddOns` est vide dans Firestore
- [ ] Vérifier: API retourne 403

### Paiement échoue
- [ ] Vérifier: STRIPE_SECRET_KEY correct
- [ ] Vérifier: Price ID exists et est correct
- [ ] Vérifier: Email Stripe est vérifié

### Webhook ne se déclenche pas
- [ ] Vérifier: `stripe listen` lancé localement
- [ ] Vérifier: Secret dans .env.local
- [ ] Vérifier: URL webhook correcte

### Lien n'apparaît pas après paiement
- [ ] Attendre 2-3 secondes (webhook asynchrone)
- [ ] Rafraîchir la page
- [ ] Vérifier Firestore: `activeAddOns`
- [ ] Vérifier logs: webhook a-t-il reçu l'événement?

## ✨ Features Bonus (Optionnel)

Après le déploiement, vous pouvez ajouter:

- [ ] Tableau de bord des add-ons actifs
- [ ] Historique des paiements
- [ ] Factures PDF
- [ ] Notifications de renouvellement
- [ ] Codes promo
- [ ] Essai gratuit (7 jours)
- [ ] Add-ons supplémentaires

## 📋 Final Checklist

**Avant de Lancer en Production:**
- [ ] Tous les tests locaux passent ✅
- [ ] Webhook fonctionne
- [ ] Firestore se met à jour
- [ ] Utilisateurs Free reçoivent paywall
- [ ] Utilisateurs Enterprise n'ont PAS paywall
- [ ] Paiement Stripe fonctionne (avec vraie carte)
- [ ] Variables Vercel ajoutées
- [ ] App redéployée en prod
- [ ] Webhook prod configuré

**Après le Lancement:**
- [ ] Monitorer les paiements
- [ ] Vérifier les webhooks
- [ ] Suivre les conversions
- [ ] Support clients prêt

---

## 🎉 Status

| Task | Status |
|------|--------|
| Code | ✅ Complet |
| Tests Locaux | 🔄 À faire |
| Production | 🔄 À configurer |
| Documentation | ✅ Complet |

**Vous êtes prêt à lancer!** 🚀
