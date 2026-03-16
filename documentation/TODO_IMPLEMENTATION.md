# 🔧 TODO & Implémentations Requises

Document listant toutes les fonctionnalités à compléter et les données hardcodées à remplacer par des données dynamiques.

---

## 🔴 Priorité HAUTE - À implémenter immédiatement

### 1. GitHub OAuth - Sauvegarde du Token
**Fichier**: `src/app/api/github/callback/route.ts` (ligne 94)
**Statut**: ⚠️ Incomplète

**À faire**:
```typescript
// Sauvegarder le token d'accès GitHub dans Firestore
const userId = await extractUserIdFromContext(); // À implémenter

await updateDoc(doc(firestore, 'users', userId), {
  github: {
    username: githubUser.login,
    accessToken: encrypt(tokenData.access_token), // Chiffrer le token!
    connectedAt: new Date(),
    id: githubUser.id,
    avatar: githubUser.avatar_url,
  }
});
```

**Dépendances**:
- Extraire l'ID utilisateur du contexte de requête
- Implémenter la fonction de chiffrement pour les tokens

---

### 2. Stripe Checkout Integration
**Fichier**: `src/app/api/subscribe/route.ts` (ligne 190)
**Statut**: ⚠️ TODO

**À faire**:
```typescript
// Intégrer Stripe Checkout
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  line_items: [
    {
      price: priceId,
      quantity: 1,
    },
  ],
  mode: 'subscription',
  success_url: `${req.headers.origin}/billing?success=true`,
  cancel_url: `${req.headers.origin}/billing?canceled=true`,
});
```

**Variables d'environnement requises**:
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLIC_KEY`
- `STRIPE_WEBHOOK_SECRET`

**À créer**:
- Webhook endpoint: `/api/webhooks/stripe`
- Webhook handler pour les événements: `invoice.paid`, `customer.subscription.deleted`

---

### 3. Données Real-time - Remplacer Mock Data
**Fichier**: `src/lib/data.ts`
**Statut**: ⚠️ Mock data à remplacer

**Problème**: 
```typescript
export const MOCK_PROJECTS = []; // Hardcodées!
export const MOCK_USAGE = {}; // Hardcodée!
```

**Solution**:
Créer des hooks pour fetcher les données depuis Firestore:
```typescript
// src/hooks/use-projects.ts
export function useProjects(userId: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, 'projects'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
    });
    
    return unsubscribe;
  }, [userId]);
  
  return projects;
}
```

---

### 4. Tests Page - Mock Data à Data Réelle
**Fichier**: `src/app/(dashboard)/tests/page.tsx` (ligne 137)
**Statut**: ⚠️ MOCK_TEST_HISTORY

**À faire**:
```typescript
// Remplacer MOCK_TEST_HISTORY par des données depuis Firestore
const { data: testRuns } = useDoc<TestRun[]>(
  doc(firestore, 'users', userId, 'testRuns')
);
```

**Données à persister**:
- Résultats des tests (passed/failed/duration)
- Historique des exécutions
- Commit hash associé

---

### 5. GitHub Commits - Intégration API
**Fichier**: `src/app/(dashboard)/tools/page.tsx` (ligne 80)
**Statut**: ⚠️ mockCommits

**À faire**:
Créer endpoint API pour fetcher les commits:
```typescript
// src/app/api/github/commits/route.ts
export async function GET(request: NextRequest) {
  const { repo, owner } = request.nextUrl.searchParams;
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      }
    }
  );
  
  const commits = await response.json();
  return NextResponse.json(commits);
}
```

**À implémenter dans le composant**:
```tsx
const [commits, setCommits] = useState([]);

useEffect(() => {
  if (!githubUsername) return;
  
  fetch(`/api/github/commits?owner=${githubUsername}&repo=...`)
    .then(r => r.json())
    .then(setCommits);
}, [githubUsername]);
```

---

## 🟡 Priorité MOYENNE - À compléter

### 6. Usage Charts - Données Réelles
**Fichier**: `src/components/dashboard/usage-charts.tsx` (ligne 16)
**Statut**: ⚠️ Mock data générée

**Problème**: 
```typescript
// Mock historical data - Doit venir de Firestore
const generateChartData = (cpuUsage, ramUsage) => {
  // Génère des données aléatoires
}
```

**Solution**:
Stocker les métriques de usage toutes les heures dans Firestore:
```typescript
// Collection: metrics/{timestamp}
{
  userId: string,
  cpu: number,
  ram: number,
  storage: number,
  timestamp: Date
}
```

---

### 7. Notifications - Données Réelles
**Fichier**: `src/app/api/notifications/route.ts` (ligne 23)
**Statut**: ⚠️ notificationsList hardcodée

**À faire**:
```typescript
// Remplacer par des notifications réelles depuis Firestore
const notificationsRef = collection(
  firestore,
  'users',
  userId,
  'notifications'
);

const docs = await getDocs(query(notificationsRef, limit(20)));
```

---

### 8. Domains - Données Réelles
**Fichier**: `src/app/api/domains/route.ts` (ligne 20)
**Statut**: ⚠️ defaultDomains exemple

**À faire**:
Fetch les domaines depuis Firestore au lieu de les créer en dur

```typescript
// Collection: users/{userId}/domains
{
  name: string,
  status: 'verified' | 'pending',
  ssl: boolean,
  createdAt: Date,
  siteId: string
}
```

---

### 9. Monitoring Data - Métriques Réelles
**Fichier**: `src/app/api/init-monitoring/route.ts` (ligne 35)
**Statut**: ⚠️ Domain d'exemple

**À faire**:
- Intégrer avec un service de monitoring réel (Prometheus, Datadog, New Relic)
- Stocker les métriques dans Firestore
- Créer des alertes basées sur les seuils

```typescript
// Collection: monitoring/{siteId}/metrics/{timestamp}
{
  uptime: number,
  latency: number,
  errorRate: number,
  requestsPerSecond: number,
  timestamp: Date
}
```

---

## 🟢 Priorité BASSE - Améliorations ultérieures

### 10. Placeholder Images - Setup CDN
**Fichier**: `src/lib/placeholder-images.json`
**Statut**: ⚠️ Images Unsplash

**À améliorer**:
- Héberger les images sur votre propre CDN
- Cacher les images en local
- Optimiser les images (WebP, compression)

---

## 📋 Liste Complète des TODOs par fichier

### API Routes - À finaliser

| Fichier | Ligne | TODO | Priorité |
|---------|-------|------|----------|
| `github/callback` | 94 | Sauvegarder token GitHub | 🔴 |
| `subscribe` | 190 | Intégrer Stripe Checkout | 🔴 |
| `domains` | 20 | Remplacer données en dur | 🟡 |
| `notifications` | 23 | Données réelles Firestore | 🟡 |
| `monitoring` | 36 | Métriques réelles | 🟡 |

### Components - À actualiser

| Fichier | Ligne | TODO | Priorité |
|---------|-------|------|----------|
| `usage-charts` | 16 | Mock data réelles | 🟡 |
| `database-config-dialog` | 422 | Valider Supabase URLs | 🟡 |

### Pages - À intégrer

| Fichier | Ligne | TODO | Priorité |
|---------|-------|------|----------|
| `tests` | 137 | MOCK_TEST_HISTORY -> Firestore | 🔴 |
| `tools` | 80 | mockCommits -> GitHub API | 🔴 |
| `storage` | - | Ajouter calcul réel du stockage | 🟡 |

### Hooks - À créer

| Hook | Données | Priorité |
|------|---------|----------|
| `use-projects` | Projets utilisateur | 🔴 |
| `use-monitoring` | Métriques monitoring | 🔴 |
| `use-github` | Infos GitHub connectées | 🔴 |
| `use-domains` | Domaines configurés | 🟡 |
| `use-test-runs` | Résultats des tests | 🔴 |

---

## 🔐 Variables d'Environnement Manquantes

```env
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_WEBHOOK_SECRET=

# Monitoring (optionnel)
DATADOG_API_KEY=
NEW_RELIC_API_KEY=

# Encryption (pour les tokens)
ENCRYPTION_KEY=
```

---

## 📝 Implémentation Recommandée - Ordre de priorité

### Phase 1 - Critique (Semaine 1)
1. ✅ Sauvegarde token GitHub
2. ✅ Intégration Stripe
3. ✅ Remplacer MOCK data par Firestore queries
4. ✅ Créer les hooks `use-projects`, `use-monitoring`, `use-tests`

### Phase 2 - Important (Semaine 2)
5. ✅ GitHub Commits API
6. ✅ Métriques de monitoring réelles
7. ✅ Données domaines depuis Firestore
8. ✅ Notifications vraies

### Phase 3 - Optimisation (Semaine 3-4)
9. ✅ Caching et performance
10. ✅ Optimisation images CDN
11. ✅ Webhooks Stripe
12. ✅ Tests E2E

---

## 🎯 Checklist de Completion

- [ ] GitHub token sauvegardé et chiffré en Firestore
- [ ] Stripe Checkout fonctionnel
- [ ] Webhooks Stripe pour subscription updates
- [ ] MOCK_PROJECTS remplacés par Firestore query
- [ ] MOCK_USAGE remplacés par Firestore query
- [ ] Test runs sauvegardés en Firestore
- [ ] Commits GitHub récupérés via API
- [ ] Monitoring métriques en temps réel
- [ ] Domains gérés en Firestore
- [ ] Notifications vraies depuis Firestore
- [ ] Encryption des tokens sensibles
- [ ] Environment variables configurées
- [ ] Tests unitaires pour API routes
- [ ] Tests E2E pour flux critiques

---

## 📚 Ressources Utiles

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Stripe Integration Guide](https://stripe.com/docs/checkout)
- [Encryption in Node.js](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**Dernière mise à jour**: 4 mars 2026  
**Status**: En cours de développement  
**Complexité globale**: Moyenne (2-3 semaines)
