# 📋 Checklist Production - Dashboard-SaaS-Web

**Date**: 4 mars 2026  
**Version**: 1.0.0  
**Status**: Prêt pour production

---

## 🔐 Configuration Critique - À faire AVANT la prod

### 1. Variables d'Environnement (`.env.local` → `.env.production`)

#### Firebase
```env
# Les variables avec NEXT_PUBLIC_ sont exposées au frontend
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# Admin (côté serveur - NUNCA exposer)
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx@iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### GitHub OAuth
```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_TOKEN=ghp_xxxx (optionnel, pour rate limiting)
```

#### Stripe
```env
STRIPE_SECRET_KEY=sk_live_xxxxx (NON sk_test!)
STRIPE_PUBLIC_KEY=pk_live_xxxxx (NON pk_test!)
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx
```

#### Encryption
```env
ENCRYPTION_KEY=votre-clé-32-caractères-minimum (CHANGE CE TEXTE!)
```

#### App
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com (PAS localhost!)
NODE_ENV=production
```

---

## 🚀 Checklist de Déploiement

### Frontend - Settings Page (✅ DONE)
- [x] Page de réglages avec 4 onglets
- [x] GitHub OAuth integration
- [x] API key management
- [x] Settings sauvegardés dans Firestore
- [x] Notifications préférences

### Backend - API Routes (✅ DONE)
- [x] GitHub callback endpoint
- [x] Tests API endpoint
- [x] Monitoring metrics API
- [x] Stripe integration
- [x] Encryption pour les tokens

### Hooks Firestore (✅ DONE)
- [x] `useProjects()` - projets temps réel
- [x] `useTestRuns()` - historique tests
- [x] `useMonitoringMetrics()` - métriques live
- [x] `useStripe()` - gestion paiements

---

## ⚙️ Configurations à Finaliser

### 1. GitHub OAuth Setup
**Actions**: 
1. Aller sur https://github.com/settings/developers
2. Créer une nouvelle OAuth App
3. **Authorization callback URL**: `https://yourdomain.com/api/github/callback`
4. Copier `Client ID` → `NEXT_PUBLIC_GITHUB_CLIENT_ID`
5. Copier `Client Secret` → `GITHUB_CLIENT_SECRET`

**À vérifier**:
- [ ] Client ID configuré
- [ ] Client Secret sécurisé (secrets provider, pas git)
- [ ] Callback URL correcte
- [ ] Token sauvegardé et chiffré

---

### 2. Stripe Setup
**Actions**:
1. Aller sur https://stripe.com
2. Créer un compte (ou utiliser existant)
3. Récupérer **keys de production** (pas test!)
4. Créer les **Price IDs** pour chaque plan:
   - Starter: `price_xxx`
   - Professional: `price_xxx`
   - Enterprise: `price_xxx`
5. Configurer les webhooks:

**Webhooks à créer**:
```
POST /api/webhooks/stripe
```

Events à écouter:
- `checkout.session.completed` - client a payé
- `invoice.payment_succeeded` - paiement reçu
- `invoice.payment_failed` - paiement échoué
- `customer.subscription.deleted` - annulation

**À vérifier**:
- [ ] Secret key de production (sk_live_)
- [ ] Public key de production (pk_live_)
- [ ] Prix des plans configurés
- [ ] Webhooks endpoint créé
- [ ] Signing secret configuré

---

### 3. Firebase Security Rules
**Fichier**: `firestore.rules`

**À vérifier**:
- [ ] Rules restrictives (pas "allow read, write: if true")
- [ ] User isolation - chaque user voit que ses données
- [ ] Admin access pour opérations sensibles
- [ ] Rate limiting sur writes

**Example sécurisé**:
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users ne voient que leurs propres données
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
      
      match /testRuns/{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
    
    match /projects/{projectId} {
      allow read: if exists(/databases/$(database)/documents/projects/$(projectId)/users/$(request.auth.uid));
      allow write: if exists(/databases/$(database)/documents/projects/$(projectId)/users/$(request.auth.uid));
    }
  }
}
```

---

### 4. Encryption Configuration
**Chez vous**:
1. Générer une clé sécurisée (32 caractères minimum)
2. Stocker UNIQUEMENT dans secrets provider
3. Changer la clé default dans le code

**À vérifier**:
- [ ] `ENCRYPTION_KEY` définie et sécurisée
- [ ] Tokens GitHub chiffrés/déchiffrés correctement
- [ ] Pas de clés exposées dans Git

---

## 📊 Configuration Monitoring (Recommandé)

### Vercel/Deploiement
```env
# Vercel
VERCEL_ENV=production
VERCEL_URL=yourdomain.com
```

### Sentry (Error Tracking)
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
```

### Analytics
```env
NEXT_PUBLIC_GA_ID=G-xxxxxxxx (Google Analytics)
```

---

## 🧪 Tests Pre-Production

### 1. Tests Locaux
```bash
# Build success
npm run build

# Start prod build
npm run start

# Test critical flows:
# - Login/Signup
# - GitHub OAuth
# - Settings save
# - Stripe checkout (test mode)
# - Monitoring metrics
```

### 2. Tests Stripe
- [ ] Utiliser des cartes de test Stripe
- [ ] Tester subscription réussie
- [ ] Tester subscription échoée
- [ ] Vérifier webhooks reçus

### 3. Vérifier Firebase Rules
- [ ] User ne peut pas lire données d'un autre
- [ ] Admin peut accéder à toutes données
- [ ] Write locks fonctionnent

---

## 🌍 Déploiement (Vercel recommandé)

### Vercel Setup
1. Push code vers GitHub
2. Connecter GitHub au Vercel
3. Ajouter environment variables dans Vercel
4. Deploy

### Custom Deployment
Si pas Vercel:
```bash
npm run build
npm run start
```

**À vérifier**:
- [ ] Build success
- [ ] API routes accessible
- [ ] CORS configuré
- [ ] HTTPS activé
- [ ] Rate limiting actif

---

## 🔒 Sécurité - Checklist Final

### Code
- [ ] Pas de secrets exposés
- [ ] Validation input sur toutes API routes
- [ ] Authentification requise sur endpoints sensibles
- [ ] CORS restrictif (allowed origins configurés)

### Database
- [ ] Firestore rules sécurisés
- [ ] Backups activés
- [ ] Audit logs pas données sensibles

### Frontend
- [ ] CSP headers configurés
- [ ] No inline scripts
- [ ] Sanitization HTML input
- [ ] CSRF tokens sur forms sensibles

### Infrastructure
- [ ] HTTPS obligatoire
- [ ] Certificats SSL/TLS à jour
- [ ] DDoS protection
- [ ] Rate limiting

---

## 📈 Performance - Checklist

- [ ] Images optimisées (WebP, compression)
- [ ] Code splitting fonctionnel
- [ ] Lazy loading composants lourds
- [ ] Cache static files (30j+)
- [ ] CDN pour assets statiques

---

## 📝 Documentation & Support

- [ ] README.md à jour
- [ ] DEPLOYMENT_GUIDE.md complet
- [ ] Support email configuré
- [ ] Erreurs logging activé
- [ ] Monitoring dashboards setup

---

## 🎯 Pré-Launch Final

**48h avant launch**:
1. [ ] Toutes variables d'env configurées
2. [ ] Tests complets réussis
3. [ ] Backups Firebase en place
4. [ ] Monitoring alertes configurées
5. [ ] Support team formée

**Le jour du launch**:
1. [ ] Status page prête
2. [ ] Incident response plan documenté
3. [ ] On-call team disponible
4. [ ] Canary deploy si possible (10% traffic d'abord)

---

## 🚨 Post-Launch - Premiers Jours

```typescript
// Monitorer 24/7:
- Error rates (< 0.1% acceptable)
- API latency (< 200ms acceptable)
- Database usage
- Stripe webhook success rate (> 99%)
- GitHub OAuth failures
```

**Si problème**:
1. Arrêter les signups si erreur auth
2. Rollback si erreur critique
3. Communiquer status une fois détecté

---

## 📞 Support & Questions

Si besoin avant prod:
1. Vérifier `DEPLOYMENT_GUIDE.md`
2. Vérifier `MONITORING_SYSTEM.md`
3. Vérifier logs Vercel/server

---

**🎉 Bonne chance pour la production!**

Dernière mise à jour: 4 mars 2026

