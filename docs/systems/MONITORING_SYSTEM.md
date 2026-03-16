# Monitoring Système - Documentation

## Vue d'ensemble

Le système de monitoring collecte les métriques réelles de vos sites et génère des alertes automatiquement.

## Composants

### 1. Health Check Service (`src/lib/health-check-service.ts`)
- Effectue des pings HTTP sur les sites
- Mesure la latence (ms)
- Calcule l'uptime en pourcentage
- Agrège les résultats

**Metrics collectées:**
- **Uptime**: Pourcentage de requêtes réussies
- **Latency**: Temps de réponse moyen (ms)
- **Error Rate**: Pourcentage d'erreurs

### 2. Alert Service (`src/lib/alert-service.ts`)
Gère les règles d'alerte prédéfinies:

**Règles par défaut:**
- Uptime < 99% → Alerte
- Uptime < 90% → Alerte critique
- Latence > 500ms → Alerte
- Latence > 1000ms → Alerte critique
- Taux d'erreur > 1% → Alerte
- Taux d'erreur > 5% → Alerte critique

### 3. API Endpoints

#### POST `/api/health-check`
Déclenche manuellement un health check pour tous les sites de l'utilisateur.

**Response:**
```json
{
  "success": true,
  "checked": 3,
  "results": [
    {
      "siteId": "...",
      "domain": "example.com",
      "metrics": {
        "uptime": 99.5,
        "latency": 145,
        "errorRate": 0.5,
        "lastCheck": 1234567890,
        "checkCount": 100,
        "errorCount": 1
      }
    }
  ]
}
```

#### GET `/api/alerts?siteId=optional`
Récupère les alertes actives.

#### POST `/api/alerts`
Crée une nouvelle alerte (générée automatiquement par le système).

#### PATCH `/api/alerts`
Marque une alerte comme résolue.

### 4. Cron Job (`src/app/api/cron/health-check/route.ts`)
S'exécute automatiquement toutes les 5 minutes pour:
- Vérifier la santé de tous les sites
- Calculer les métriques
- Créer des alertes si nécessaire

**Configuration:** `vercel.json`

### 5. Page Monitoring (`src/app/(dashboard)/monitoring/page.tsx`)
Interface utilisateur pour:
- Voir les métriques en temps réel
- Déclencher un health check manuel
- Voir les alertes actives
- Marquer les alertes comme résolues
- Filtrer par site

## Flux de données

```
Health Check (Manual / Cron)
    ↓
performHealthCheck() → HTTP ping → Status + Latency
    ↓
calculateMetrics() → Aggregrate last 100 checks
    ↓
Save to Firestore: users/{userId}/sites/{siteId}/metrics
    ↓
Check Alert Rules → Create Alerts if needed
    ↓
Save to Firestore: users/{userId}/sites/{siteId}/alerts
    ↓
API /monitoring fetches and displays data
```

## Structure Firestore

```
users/{userId}
├── sites/{siteId}
│   ├── domain (string)
│   ├── name (string)
│   ├── metrics:
│   │   ├── uptime (number %)
│   │   ├── latency (number ms)
│   │   ├── errorRate (number %)
│   │   ├── lastCheck (timestamp)
│   │   └── status (healthy|warning|critical)
│   ├── healthChecks/{checkId}
│   │   ├── domain
│   │   ├── status (HTTP code)
│   │   ├── latency
│   │   ├── healthy (boolean)
│   │   └── timestamp
│   └── alerts/{alertId}
│       ├── rule (string ID)
│       ├── severity (info|warning|critical)
│       ├── message (string)
│       ├── timestamp
│       ├── resolved (boolean)
│       └── createdAt
```

## Utilisation

### Démarrage automatique
Le Cron job lancera automatiquement les health checks toutes les 5 minutes.

### Vérification manuelle
1. Allez sur la page Monitoring
2. Cliquez sur "Lancer un health check"
3. Les résultats s'affichent immédiatement

### Gestion des alertes
1. Les alertes s'affichent dans la section "Alertes actives"
2. Cliquez "Résoudre" pour marquer comme résolue
3. Les alertes disparaissent après résolution

## Variables d'environnement requises

L'API utilise les variables Firebase standard:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- Et autres...

Pour Vercel Cron, ajouter:
- `CRON_SECRET`: Clé secrète pour autoriser les appels Cron

## Notes

- Les health checks utilisent `fetch` avec timeout de 10 secondes
- Les domaines sont normalisés (ajout de https:// si nécessaire)
- Les métriques sont calculées sur les 100 derniers checks
- Les alertes ne sont créées qu'une fois (pas de doublons)
- L'Uptime = pourcentage de réponses 2xx/3xx
- La Latence = temps complet du round-trip HTTP

## Limitations actuelles

- Les health checks ne peuvent vérifier que des URLs publiques
- Pas de vérification des endpoints personnalisés (pas de paths)
- Pas de test de contenu (vérification du statut HTTP uniquement)
- Pas d'historique d'alertes résolues (soft delete seulement)
