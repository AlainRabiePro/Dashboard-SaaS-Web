# 🚀 Guide de Déploiement Automatisé

Ce guide explique comment configurer le système de déploiement automatisé pour ton SaaS.

## Architecture

```
┌─────────────────┐
│  Frontend SaaS  │  (Next.js - Cette application)
│  (Dashboard)    │
└────────┬────────┘
         │ Form: domain + repoUrl
         │
         ▼
      API: /api/deploy (le navigateur envoie au serveur)
         │ Validation + Firebase Auth
         │
         ▼
   ┌─────────────────────────────────────┐
   │  Backend Node.js (Next.js API Route)│
   │        (Sur ton serveur)             │
   └──────────┬──────────────────────────┘
              │ SSH Connection
              │
              ▼
   ┌──────────────────────────────┐
   │  Serveur Linux de Production │
   │  - Exécute deploy.sh         │
   │  - Clone le repo Git         │
   │  - Installe les dépendances  │
   │  - Configure Nginx           │
   │  - Génère SSL Certbot        │
   └──────────────────────────────┘
```

## Prérequis

1. **Serveur Linux** (Ubuntu 20.04+ recommandé)
   - SSH activé
   - Accès root ou utilisateur avec sudo

2. **Node.js/npm** sur ta machine de développement

3. **Firebase Project** (pour l'authentification)

## Étape 1 : Installer les dépendances

```bash
npm install node-ssh
npm install --save-dev @types/node-ssh
```

## Étape 2 : Configurer les variables d'environnement

Copie `.env.example` en `.env.local` et remplis tes informations :

```bash
cp .env.example .env.local
```

Édite `.env.local` :

```env
DEPLOY_SSH_HOST=your-server.com
DEPLOY_SSH_USER=deploy
DEPLOY_SSH_PASSWORD=your-password  # OU utilise une clé privée
DEPLOY_SCRIPT_PATH=/home/deploy/deploy.sh
```

### Option A : Utiliser mot de passe SSH

```env
DEPLOY_SSH_PASSWORD=your_secure_password
```

### Option B : Utiliser clé privée SSH (recommandé)

```bash
# Sur ton serveur, génère une clé SSH
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key

# Ajoute la clé publique au fichier authorized_keys
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Récupère la clé privée (en base64)
cat ~/.ssh/deploy_key | base64 -w 0

# Colle dans .env.local
DEPLOY_SSH_PRIVATE_KEY=LS0tLS1CRUdJTi...
```

On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("C:\path\to\deploy_key")) | Set-Clipboard
```

## Étape 3 : Préparer ton serveur de déploiement

### Créer utilisateur `deploy`

```bash
# Sur le serveur
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy
```

### Copier le script de déploiement

```bash
# Sur ta machine locale
scp bash/deploy.sh deploy@your-server.com:/home/deploy/

# Sur le serveur
ssh deploy@your-server.com
chmod +x /home/deploy/deploy.sh
```

### Vérifier la connexion SSH

```bash
# Depuis ton projet
ssh -i ~/.ssh/deploy_key deploy@your-server.com "echo 'SSH OK'"
```

## Étape 4 : Tester le déploiement

Via le dashboard:

1. 📱 Ouvre ton SaaS (page Dashboard)
2. 🛠️ Aller à "Boîte à Outils"
3. 🎯 Clique sur "Déployer un site"
4. 📝 Entre:
   - **Domaine**: `mon-site.com`
   - **Repo Git**: `https://github.com/user/mon-repo.git` (URL publique)
5. ✅ Lance le déploiement

## Flux d'exécution

```
1. L'utilisateur remplit le formulaire
   ↓
2. handleDeploySubmit récupère le token Firebase
   ↓
3. Envoie une requête POST à /api/deploy
   {
     "domain": "mon-site.com",
     "repoUrl": "https://github.com/user/mon-repo.git"
   }
   ↓
4. L'API valide les données et la permission Firebase
   ↓
5. Connexion SSH au serveur de déploiement
   ↓
6. Exécution du script deploy.sh via SSH
   ↓
7. Le script demande interactivement:
   - Lien du repo Git
   - Nom de domaine
   - Inclure AdSense? (o/n)
   - Confirmation
   ↓
8. Le script:
   - Clone le repo
   - Détecte la technologie (Next.js, Docker, etc.)
   - Installe les dépendances
   - Lance le serveur sur un port libre
   - Configure Nginx
   - Génère un certificat SSL
   ↓
9. Succès ! Le site est accessible à https://mon-site.com
```

## Variables de l'API

### Request

```json
{
  "domain": "mon-site.com",
  "repoUrl": "https://github.com/user/repo.git",
  "adsenseId": "ca-pub-XXXXXXXXXXXXXXXX" // optionnel
}
```

### Headers

```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

### Response

Succès (200):
```json
{
  "success": true,
  "message": "Déploiement lancé avec succès",
  "domain": "mon-site.com",
  "output": "... logs du déploiement ..."
}
```

Erreur:
```json
{
  "error": "Erreur lors du déploiement",
  "message": "Description de l'erreur"
}
```

## Sécurité

✅ **Authentification Firebase** - Seuls les utilisateurs authentifiés peuvent déployer

✅ **Validation des entrées** - Domaines et URLs validés

✅ **Clé SSH privée** - Stockée en .env.local (jamais commité)

✅ **Timeout** - Les déploiements ont un timeout de 30 minutes

⚠️ **Note**: Le repo git doit être **public** au moment du déploiement

## Dépannage

### "SSH Connection refused"
- Vérifies que SSH est activé sur le serveur
- `ssh -i key deploy@host` fonctionne ?

### "deploy.sh not found"
- Vérifie `DEPLOY_SCRIPT_PATH` dans .env.local
- Le fichier existe sur le serveur?

### "Permission denied"
- L'utilisateur `deploy` a besoin des permissions appropriées
- Teste: `ssh ... "sudo deploy.sh"`

### Timeout pendant le déploiement
- Les déploiements peuvent prendre du temps pour les gros repos
- Augmente le timeout dans l'API si nécessaire

## Amélioration future

- [ ] Ajouter un système de queue pour les déploiements
- [ ] Webhook pour notifier les utilisateurs du statut
- [ ] Support de multiples serveurs
- [ ] Rollback automatique
- [ ] Monitoring des sites déployés
- [ ] Logs détaillés dans Firestore

## Support

Si tu as des questions, consulte:
- [Documentation Next.js](https://nextjs.org/docs)
- [node-ssh](https://www.npmjs.com/package/node-ssh)
- [Firebase Auth](https://firebase.google.com/docs/auth)
