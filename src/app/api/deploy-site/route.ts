import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

/**
 * API pour déployer un site sur le VPS
 * Crée la structure de dossiers sur le VPS
 */

let adminApp = getApps()[0];
if (!adminApp) {
  try {
    const credential = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (credential.projectId && credential.clientEmail && credential.privateKey) {
      adminApp = initializeApp({
        credential: cert(credential as any),
      });
    }
  } catch (error) {
    console.error('Firebase Admin init error:', error);
  }
}

async function verifyToken(token: string): Promise<string | null> {
  try {
    if (adminApp) {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(token);
      return decodedToken.uid;
    }

    // Fallback REST API
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) return null;

    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.users?.[0]?.localId || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

async function deploySiteOnVPS(userId: string, siteName: string): Promise<boolean> {
  try {
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });

    // Normaliser le nom du dossier : "instacraft.fr" -> "instacraft-fr"
    const folderName = siteName.toLowerCase().replace(/\./g, '-');
    
    // Créer le dossier du site
    const siteDir = `/var/www/users/${userId}/sites/${folderName}`;
    await ssh.execCommand(`mkdir -p ${siteDir}/public`);
    
    // Créer un fichier index.html basique
    const indexPath = `${siteDir}/public/index.html`;
    await ssh.execCommand(`cat > ${indexPath} << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { text-align: center; color: white; }
        h1 { font-size: 3em; margin-bottom: 10px; }
        p { font-size: 1.2em; opacity: 0.9; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${siteName}</h1>
        <p>Déploiement réussi! 🎉</p>
    </div>
</body>
</html>
EOF`);

    // Configurer nginx pour servir le site
    const nginxConfig = `/etc/nginx/sites-available/${siteName}`;
    const nginxConfigContent = `server {
    listen 80;
    server_name ${siteName};
    root /var/www/users/${userId}/sites/${folderName}/public;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}`;

    await ssh.execCommand(`cat > ${nginxConfig} << 'EOF'
${nginxConfigContent}
EOF`);

    // Activer la configuration nginx
    await ssh.execCommand(`ln -sf ${nginxConfig} /etc/nginx/sites-enabled/${siteName} || true`);
    
    // Tester et recharger nginx
    await ssh.execCommand('nginx -t && systemctl reload nginx');

    console.log(`✅ Site ${siteName} déployé sur le VPS`);
    ssh.dispose();
    return true;
  } catch (error) {
    console.error('Erreur lors du déploiement sur le VPS:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { siteName } = body;

    if (!siteName) {
      return NextResponse.json({ error: 'siteName requis' }, { status: 400 });
    }

    // Déployer le site sur le VPS
    const deployed = await deploySiteOnVPS(userId, siteName);

    if (!deployed) {
      return NextResponse.json(
        { error: 'Erreur lors du déploiement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Site ${siteName} déployé avec succès`,
      siteName,
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors du déploiement',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
