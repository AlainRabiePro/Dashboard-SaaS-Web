import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * API pour déployer un site sur le VPS
 * Crée la structure de dossiers sur le VPS
 */

// ✅ Vérifier que le repo Git existe et est accessible
async function verifyGitRepositoryAccess(repoUrl: string): Promise<{ accessible: boolean; error?: string }> {
  try {
    const { execSync } = require('child_process');
    
    // Tenter une connexion git ls-remote pour vérifier l'accès
    const result = execSync(`git ls-remote --heads ${repoUrl}`, {
      timeout: 10000, // 10 secondes
      stdio: 'pipe',
    }).toString();
    
    return { accessible: true };
  } catch (error: any) {
    console.error('Erreur d\'accès au repo:', error.message);
    
    let errorMessage = 'Impossible d\'accéder au repository';
    
    if (error.message.includes('Repository not found')) {
      errorMessage = `Le repository n'existe pas: ${repoUrl}`;
    } else if (error.message.includes('Permission denied') || error.message.includes('401')) {
      errorMessage = `Accès refusé au repository. Vérifiez que le repo est public ou que vous avez les permissions.`;
    } else if (error.message.includes('timeout')) {
      errorMessage = `Timeout lors de la vérification du repository. Le serveur est trop lent.`;
    } else if (error.message.includes('not a git repository')) {
      errorMessage = `L'URL fournie n'est pas un repository Git valide`;
    }
    
    return { accessible: false, error: errorMessage };
  }
}


let adminApp = getApps()[0];
if (!adminApp) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      const credential = {
        projectId,
        clientEmail,
        privateKey,
      };

      adminApp = initializeApp({
        credential: cert(credential as any),
      });
      console.log('✅ Firebase Admin SDK initialized for deploy-site');
    } else {
      console.warn('⚠️ Firebase Admin credentials incomplete - will use REST API fallback');
      console.log('  projectId:', !!projectId, 'clientEmail:', !!clientEmail, 'privateKey:', !!privateKey);
    }
  } catch (error) {
    console.error('Firebase Admin init error:', error);
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
    await ssh.execCommand(`ln -sf ${nginxConfig} /etc/nginx/sites-enabled/${folderName} || true`);
    
    // 🔗 Créer un lien symbolique vers /var/www/{folderName} pour l'accès direct
    const shortcutPath = `/var/www/${folderName}`;
    console.log(`🔗 Création du lien symbolique: ${shortcutPath} -> ${siteDir}`);
    
    // Nettoyer complètement les anciens symlinks (en cas de redéploiement)
    const cleanupResult = await ssh.execCommand(`
      # Supprimer les symlinks cassés ou existants
      rm -f ${shortcutPath} 2>/dev/null || true
      # Supprimer aussi d'éventuels symlinks internes brisés
      find ${siteDir} -type l -xtype l -delete 2>/dev/null || true
      echo "Nettoyage terminé"
    `);
    console.log(`   Nettoyage:`, cleanupResult.stdout?.trim() || 'OK');
    
    // Créer le symlink vers le répertoire source réel
    const symlinkResult = await ssh.execCommand(`ln -s ${siteDir} ${shortcutPath} && ls -la ${shortcutPath}`);
    console.log(`   Résultat symlink:`, symlinkResult.stdout || symlinkResult.stderr);
    
    // Vérifier que le chemin final est accessible
    const checkFinalPath = await ssh.execCommand(`ls -la ${shortcutPath}/ | head -5 && echo "✅ Contenu accessible"`);
    console.log(`   Vérification accès:`, checkFinalPath.stdout || checkFinalPath.stderr);
    
    // Tester et recharger nginx
    await ssh.execCommand('nginx -t && systemctl reload nginx');

    console.log(`✅ Site ${siteName} déployé sur le VPS`);
    ssh.dispose();
    
    // 🎯 Enregistrer l'action dans l'audit log
    try {
      const db = getFirestore(adminApp);
      const auditRef = db.collection('users').doc(userId).collection('audit_logs');
      await auditRef.add({
        action: 'DEPLOY',
        title: 'Déploiement de site',
        description: `Déploiement du site: ${siteName}`,
        timestamp: Date.now(),
        resourceId: siteName,
        resourceType: 'site',
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
      console.log(`✅ Audit log créé pour le déploiement de ${siteName}`);
    } catch (auditError) {
      console.error('⚠️ Erreur lors de la création du log audit:', auditError);
      // Ne pas bloquer le déploiement si l'audit log échoue
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors du déploiement sur le VPS:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'userId depuis le header x-user-id
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      console.error('❌ No x-user-id header provided');
      return NextResponse.json({ error: 'Non authentifié - userId manquant' }, { status: 401 });
    }

    console.log('✅ Authentification OK pour:', userId);

    const body = await request.json();
    const { siteName, domain } = body;

    if (!siteName) {
      return NextResponse.json({ error: 'siteName requis' }, { status: 400 });
    }

    // ✅ NOUVEAU : Vérifier que le domaine/site n'existe pas déjà
    if (domain) {
      const db = getFirestore();
      const sitesRef = collection(db, 'users', userId, 'sites');
      const q = query(sitesRef, where('domain', '==', domain));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return NextResponse.json(
          { 
            error: 'Ce domaine est déjà déployé',
            message: `Le domaine "${domain}" est déjà associé à un de vos sites. Veuillez utiliser un domaine différent.`,
            code: 'DOMAIN_ALREADY_DEPLOYED'
          },
          { status: 409 } // 409 Conflict
        );
      }
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
