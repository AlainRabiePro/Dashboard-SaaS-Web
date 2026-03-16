# DIAGRAMME DE FLUX - Prouve que tout fonctionne en temps réel

## FLUX 1: SYNCHRONISATION (SYNC)

```
UTILISATEUR CLIQUE "SAUVEGARDER SYNCHRONISATION"
        |
        v
[TOOLS] Starting sync...
console.log('🚀 [TOOLS] Starting sync...', {userId, timestamp})
        |
        v
FETCH /api/sync POST
headers: {
  'Content-Type': 'application/json',
  'x-user-id': userId
}
body: { type: 'full' }
        |
        v
API REÇOIT LA REQUETE
console.log('📡 [SYNC] POST request from user:', userId)
        |
        v
FIRESTORE: getDocs(users/{userId}/sites)
console.log('ℹ️ [SYNC] Processing users/{userId}/sites collection...')
        |
        v
FIRESTORE: updateDoc(users/{userId})
Set: { lastSync: timestamp, syncLogs: [...] }
console.log('✅ [SYNC] Successfully synced', sites.length, 'sites to cloud', {...})
        |
        v
RESPONSE JSON
{
  success: true,
  synced: 3,
  sites: [{id, name, status: 'synced'}, ...],
  timestamp: 1705329046456
}
        |
        v
TOOLS PAGE REÇOIT LA REPONSE
console.log('✅ [TOOLS] Sync completed:', data)
        |
        v
TOAST AFFICHE
✅ Synchronisation complétée
3 site(s) synchronisé(s) avec le cloud Firestore en temps réel
        |
        v
FIRESTORE PERSISTE LES DONNEES
Path: users/{userId}/sites
Path: users/{userId} (lastSync + syncLogs)

VERIFICATION POSSIBLE EN TEMPS REEL DANS:
Firebase Console > Cloud Firestore > Browse Documents
```

---

## FLUX 2: CONFIGURATION ADSENSE

```
UTILISATEUR ENTRE "ca-pub-1234567890" ET CLIQUE SAUVEGARDER
        |
        v
[TOOLS] Configuring AdSense for: site-1
console.log('🚀 [TOOLS] Configuring AdSense...', {siteId, publisherId, userId, timestamp})
        |
        v
VALIDATION: publisherId.startsWith('ca-pub-')
✅ Format valid
        |
        v
FETCH /api/ads/config POST
headers: {
  'x-user-id': userId
}
body: {
  publisherId: 'ca-pub-1234567890',
  enabled: true,
  settings: {...}
}
        |
        v
API VALIDE ET SAUVEGARDE
console.log('📡 [ADS CONFIG] POST request from user:', userId)
console.log('📝 [ADS CONFIG] Saving config:', publisherId)
        |
        v
FIRESTORE: setDoc(users/{userId}/ads_config/main, config)
console.log('✅ [ADS CONFIG] Successfully saved to Firestore', {
  userId, publisherId, enabled, timestamp,
  path: 'users/{userId}/ads_config/main'
})
        |
        v
RESPONSE
{
  publisherId: 'ca-pub-1234567890',
  enabled: true,
  adSlots: [],
  settings: {...},
  id: userId
}
        |
        v
TOOLS PAGE
console.log('✅ [TOOLS] AdSense config saved:', result)
        |
        v
TOAST AFFICHE
✅ AdSense configuré
ca-pub-1234567890 sauvegardé dans Firestore pour Mon Site
        |
        v
FIRESTORE PERSISTE
Path: users/{userId}/ads_config/main
Data: {
  publisherId: 'ca-pub-1234567890',
  enabled: true,
  adSlots: [],
  settings: {autoRefresh: true, ...},
  lastUpdated: 1705329616111
}

VERIFICATION:
Firebase Console > Cloud Firestore > 
users > [userId] > ads_config > main
Tu verras le document avec tous les champs
```

---

## FLUX 3: CREATION ET RESTAURATION DE BACKUP

```
UTILISATEUR CLIQUE "CRÉER BACKUP"
        |
        v
FETCH /api/backup POST
body: {
  siteId: 'site-1',
  commitHash: 'a1b2c3d4e5f6g7h8',
  commitMessage: 'Manual backup',
  size: 2535
}
        |
        v
API TRAITE LA REQUETE
console.log('📡 [BACKUP] POST request from user:', userId)
backupId = 'backup-' + Date.now()
        |
        v
FIRESTORE: setDoc(users/{userId}/backups/{backupId}, backup)
console.log('✅ [BACKUP] Successfully created backup:', backupId, {
  userId, siteId, commitHash, timestamp,
  path: 'users/{userId}/backups/{backupId}',
  size: '2.48KB'
})
        |
        v
FIRESTORE PERSISTE
Path: users/{userId}/backups/backup-1705330815234
Data: {
  id: 'backup-1705330815234',
  siteId: 'site-1',
  timestamp: 1705330815234,
  commitHash: 'a1b2c3d4e5f6g7h8',
  commitMessage: 'Manual backup',
  size: 2535,
  status: 'completed'
}

---

PLUS TARD: UTILISATEUR CLIQUE "RESTAURER" SUR UN BACKUP
        |
        v
[TOOLS] Restoring backup: backup-1705330500000
console.log('🚀 [TOOLS] Restoring backup:', {commitId, siteId, userId, timestamp})
        |
        v
FETCH /api/backup PUT
body: {
  backupId: 'backup-1705330500000',
  siteId: 'site-1'
}
        |
        v
API RESTORE
console.log('📡 [BACKUP] PUT request from user:', userId)
        |
        v
FIRESTORE: getDoc(users/{userId}/backups/{backupId})
FIRESTORE: updateDoc(users/{userId}/sites/{siteId})
console.log('✅ [TOOLS] Backup restored:', {
  commitId, siteId, timestamp,
  path: 'users/{userId}/backups/{backupId}',
  response: {...}
})
        |
        v
TOAST
✅ Restauration lancée
La version backup-1705330500000 est en cours de déploiement depuis Firestore
        |
        v
FIRESTORE PERSISTE
Path: users/{userId}/sites/{siteId}
Updated: status, lastRestore, restoredFrom, etc.
```

---

## FLUX 4: VIDAGE DU CACHE

```
UTILISATEUR CLIQUE "VIDER LE CACHE"
        |
        v
[TOOLS] Starting cache clear...
console.log('🚀 [TOOLS] Starting cache clear...', {userId, timestamp})
        |
        v
FETCH /api/cache DELETE
headers: {
  'x-user-id': userId
}
        |
        v
API TRAITE
console.log('📡 [CACHE] DELETE request - clearing cache for user:', userId)
        |
        v
FIRESTORE: setDoc(users/{userId}/cache_stats/global, {
  size: 0,
  itemsCount: 0,
  lastCleared: timestamp,
  enabled: true
})
console.log('✅ [CACHE] Successfully cleared', {
  userId, siteId: 'global', timestamp,
  path: 'users/{userId}/cache_stats/global',
  newSize: 0, newItemsCount: 0
})
        |
        v
RESPONSE
{
  success: true,
  message: 'Cache vidé avec succès',
  timestamp: 1705329321234,
  cleared: true,
  size: 0,
  itemsCount: 0
}
        |
        v
TOOLS PAGE
console.log('✅ [TOOLS] Cache cleared:', data)
        |
        v
TOAST
🗑️ Cache vidé
Votre cache a été vidé avec succès. Firestore mis à jour à 14:35:21
        |
        v
FIRESTORE PERSISTE
Path: users/{userId}/cache_stats/global
Data: {
  size: 0,
  itemsCount: 0,
  lastCleared: 1705329321234,
  enabled: true
}
```

---

## FLUX 5: AFFICHAGE DES VERSIONS

```
PAGE CHARGE OU UTILISATEUR CHANGE DE SITE
        |
        v
FETCH /api/versions GET
query: ?siteId=site-1
headers: {
  'x-user-id': userId
}
        |
        v
API TRAITE
console.log('📡 [VERSIONS] GET request - user:', userId, 'site:', siteId)
        |
        v
FIRESTORE: getDocs(
  query(
    collection(users/{userId}/versions),
    where('siteId', '==', siteId)
  )
)
        |
        v
SORT BY versionNumber DESC
console.log('✅ [VERSIONS] Found', versions.length, 'versions in Firestore', {
  userId, siteId,
  versions: [{versionNumber, commitHash, status, timestamp}, ...]
})
        |
        v
RESPONSE
[
  {
    id: 'version-8',
    siteId: 'site-1',
    versionNumber: 8,
    commitHash: 'latest123...',
    status: 'released',
    timestamp: 1705329600000
  },
  {
    id: 'version-7',
    siteId: 'site-1',
    versionNumber: 7,
    commitHash: 'prev12345...',
    status: 'staging',
    timestamp: 1705329300000
  }
]
        |
        v
UI AFFICHE LA LISTE DES VERSIONS
Avec dates, status, et bouton "Restaurer"
```

---

## VERIFICATION EN TEMPS REEL

### Ce que tu vérifies dans la console:

1. **Console du navigateur (F12)**
   ```
   [TOOLS] Starting sync...
   [SYNC] POST request from user: user123
   [SYNC] Successfully synced 3 sites to cloud
   [TOOLS] Sync completed: {...data}
   ```

2. **Firebase Console (côté navigateur droit)**
   ```
   Path: users/user123
   lastSync: 1705329046456 (timestamp qui augmente)
   syncLogs: [new entry with timestamp]
   ```

3. **Vercel Logs (en production)**
   ```
   https://vercel.com → Ton projet → Logs
   Tous les console.log apparaîtront là
   ```

### Checklist de vérification:

- [ ] Console affiche [TOOLS] Starting
- [ ] Console affiche [SERVICE] POST/GET/DELETE
- [ ] Console affiche [SERVICE] Successfully
- [ ] Path Firestore visible dans les logs
- [ ] Timestamp ISO dans les logs
- [ ] Firebase montre les données mises à jour
- [ ] Toast affiche confirmation
- [ ] Pas d'erreur 500
- [ ] Pas de 401 Unauthorized
- [ ] Tout s'exécute < 1 second

Si tu coches tout = C'est 100% REEL! 🎉

---

## EXEMPLE COMPLET: Sync

Console du navigateur:
```
🚀 [TOOLS] Starting sync... {
  userId: 'user-abc123',
  timestamp: '2024-01-15T14:30:45.123Z'
}

📡 [SYNC] POST request from user: user-abc123

🔄 [SYNC] Starting full synchronization

ℹ️ [SYNC] Processing users/user-abc123/sites collection...

✅ [SYNC] Successfully synced 3 sites to cloud {
  userId: 'user-abc123',
  type: 'full',
  timestamp: '2024-01-15T14:30:46.456Z',
  sites: ['Agence Web Pro', 'E-Commerce Store', 'Blog Tech'],
  path: 'users/user-abc123',
  syncLogsCount: 'updated'
}

✅ [TOOLS] Sync completed: {
  synced: 3,
  timestamp: 1705329046456,
  sites: [
    {id: 'site-1', name: 'Agence Web Pro', status: 'synced'},
    {id: 'site-2', name: 'E-Commerce Store', status: 'synced'},
    {id: 'site-3', name: 'Blog Tech', status: 'synced'}
  ],
  response: {success: true, message: 'Synchronisation full completee'}
}
```

Toast affiché:
```
✅ Synchronisation complétée
3 site(s) synchronisé(s) avec le cloud Firestore en temps réel
```

Firestore mis à jour:
```
Path: users/user-abc123
Fields updated:
  - lastSync: 1705329046456
  - syncLogs: array with new entry
```

TOUT EST EN TEMPS REEL! 🔄
