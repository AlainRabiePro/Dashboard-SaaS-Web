import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

/**
 * API pour supprimer un site du VPS et de la base de données
 */

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
      console.log('✅ Firebase Admin SDK initialized');
    } else {
      console.warn('⚠️ Firebase Admin credentials incomplete - will use REST API fallback');
      console.log('  projectId:', !!projectId, 'clientEmail:', !!clientEmail, 'privateKey:', !!privateKey);
    }
  } catch (error) {
    console.error('Firebase Admin init error:', error);
  }
}

async function verifyToken(token: string): Promise<string | null> {
  try {
    if (adminApp) {
      try {
        const auth = getAuth(adminApp);
        const decodedToken = await auth.verifyIdToken(token);
        console.log('✅ Token verified with Admin SDK:', decodedToken.uid);
        return decodedToken.uid;
      } catch (adminError) {
        console.warn('⚠️ Admin SDK verification failed, trying REST API:', adminError);
      }
    } else {
      console.warn('⚠️ Admin app not initialized, using REST API');
    }

    // Fallback REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      console.error('❌ FIREBASE_API_KEY not configured');
      return null;
    }

    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ REST API lookup failed:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    const userId = data.users?.[0]?.localId;
    if (userId) {
      console.log('✅ Token verified with REST API:', userId);
    } else {
      console.error('❌ No userId found in REST API response');
    }
    return userId || null;
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return null;
  }
}

async function deleteSiteFromVPS(userId: string, siteName: string): Promise<boolean> {
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

    // 1. Trouver le dossier réel du site (en cas de lien symbolique)
    const siteLink = `/var/www/users/${userId}/sites/${folderName}`;
    console.log(`1️⃣ Récupération du dossier réel...`);
    const readlinkResult = await ssh.execCommand(`readlink -f ${siteLink} 2>/dev/null || echo ${siteLink}`);
    const realSiteDir = readlinkResult.stdout.trim();
    console.log(`   Lien: ${siteLink}`);
    console.log(`   Réel: ${realSiteDir}`);

    // 2. Supprimer le lien symbolique
    console.log(`2️⃣ Suppression du lien symbolique...`);
    await ssh.execCommand(`rm -f ${siteLink}`);

    // 3. Supprimer le dossier réel
    console.log(`3️⃣ Suppression du dossier réel: ${realSiteDir}`);
    const rmResult = await ssh.execCommand(`rm -rf ${realSiteDir}`);
    console.log(`   Résultat: ${rmResult.stdout || 'OK'}`);

    // 4. Vérifier suppression
    const checkReal = await ssh.execCommand(`[ -d ${realSiteDir} ] && echo "STILL_EXISTS" || echo "DELETED"`);
    const checkLink = await ssh.execCommand(`[ -L ${siteLink} ] && echo "STILL_EXISTS" || echo "DELETED"`);
    console.log(`   Vérification lien: ${checkLink.stdout.trim()}`);
    console.log(`   Vérification dossier: ${checkReal.stdout.trim()}`);

    if (checkReal.stdout.includes("STILL_EXISTS")) {
      console.warn(`⚠️ Le dossier réel existe encore! Tentative agressive...`);
      await ssh.execCommand(`find ${realSiteDir} -type f -delete 2>/dev/null && find ${realSiteDir} -type d -delete 2>/dev/null || true`);
    }

    // 5. Supprimer les logs nginx du site
    console.log(`4️⃣ Suppression des logs nginx...`);
    await ssh.execCommand(`rm -f /var/log/nginx/${folderName}_access.log*`);
    await ssh.execCommand(`rm -f /var/log/nginx/${folderName}_error.log*`);

    // 6. Supprimer les fichiers nginx
    const nginxEnabled = `/etc/nginx/sites-enabled/${siteName}`;
    const nginxConfig = `/etc/nginx/sites-available/${siteName}`;
    
    console.log(`5️⃣ Suppression config nginx...`);
    await ssh.execCommand(`rm -f ${nginxEnabled} ${nginxConfig}`);

    // 7. Test nginx
    console.log(`6️⃣ Test configuration nginx...`);
    const testResult = await ssh.execCommand('nginx -t 2>&1');
    if (testResult.code !== 0) {
      console.error(`❌ Nginx test failed: ${testResult.stderr}`);
      throw new Error('Nginx configuration test failed');
    }
    console.log(`   ✅ Nginx config OK`);

    // 8. Arrêter et redémarrer nginx
    console.log(`7️⃣ Redémarrage de nginx...`);
    await ssh.execCommand('systemctl stop nginx');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const startResult = await ssh.execCommand('systemctl start nginx');
    console.log(`   Start: ${startResult.code}`);

    // 9. Vérifier que nginx est bien running
    const serviceStatus = await ssh.execCommand('systemctl is-active nginx');
    console.log(`   Status: ${serviceStatus.stdout.trim()}`);

    // 10. Vérification finale
    const finalCheckLink = await ssh.execCommand(`[ -L ${siteLink} ] && du -sh ${siteLink} || echo "Lien supprimé"`);
    const finalCheckReal = await ssh.execCommand(`[ -d ${realSiteDir} ] && du -sh ${realSiteDir} || echo "Dossier supprimé"`);
    console.log(`   Lien final: ${finalCheckLink.stdout.trim()}`);
    console.log(`   Dossier réel final: ${finalCheckReal.stdout.trim()}`);

    if (serviceStatus.stdout.includes('active') && checkReal.stdout.includes('DELETED') && checkLink.stdout.includes('DELETED')) {
      console.log(`✅ Site ${siteName} complètement supprimé du VPS (lien + dossier réel + logs nginx + config)`);
      ssh.dispose();
      return true;
    } else {
      console.error(`⚠️ Suppression incomplète`);
      ssh.dispose();
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du site du VPS:', error);
    return false;
  }
}

async function deleteSiteFromFirestore(userId: string, siteId: string): Promise<boolean> {
  try {
    // Essayer avec Admin d'abord
    if (adminApp) {
      try {
        const db = getFirestore(adminApp);
        const siteRef = db.collection('users').doc(userId).collection('sites').doc(siteId);
        await siteRef.delete();
        console.log(`✅ Site ${siteId} supprimé de Firestore avec Admin`);
        return true;
      } catch (adminError) {
        console.warn(`⚠️ Admin deletion failed:`, adminError);
      }
    }

    // Fallback: Utiliser l'API REST de Firestore
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.error('❌ FIREBASE_PROJECT_ID not configured - impossible de supprimer de Firestore');
      return false;
    }

    // Pour l'API REST Firestore sans authentification admin, on doit utiliser la collection path
    // https://firebase.google.com/docs/firestore/manage-data/delete-data#rest
    const deleteUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/sites/${siteId}`;
    
    console.log(`🔗 Suppression via REST API Firestore (sans authentification - accès public)`);
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
    });

    if (response.status === 404) {
      console.warn(`⚠️ Site ${siteId} non trouvé dans Firestore (déjà supprimé ?)`);
      return true;
    }

    if (response.status === 403) {
      console.warn(`⚠️ Firestore requiert une authentification - le site reste dans Firestore`);
      console.log(`   💡 Solution: Configurer FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY pour l'Admin SDK`);
      return false; // Échec mais pas critique
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur Firestore REST API: ${response.status} ${response.statusText}`);
      console.error(`   Détails: ${errorText}`);
      return false;
    }

    console.log(`✅ Site ${siteId} supprimé de Firestore via REST API`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du site de Firestore:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ No authorization header or invalid format');
      return NextResponse.json({ error: 'Non authentifié - header manquant' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('🔐 Vérification du token...');
    const userId = await verifyToken(token);

    if (!userId) {
      console.error('❌ Token verification failed');
      return NextResponse.json({ error: 'Token invalide - authentification échouée' }, { status: 401 });
    }

    console.log('✅ Authentification OK pour:', userId);

    const body = await request.json();
    const { siteName, siteId } = body;

    if (!siteName || !siteId) {
      return NextResponse.json({ error: 'siteName et siteId requis' }, { status: 400 });
    }

    console.log(`\n🗑️ Suppression du site: ${siteName} (${siteId}) pour l'utilisateur ${userId}`);

    // 1. Supprimer du VPS
    console.log('Step 1: Suppression du VPS...');
    const vpsDeleted = await deleteSiteFromVPS(userId, siteName);
    if (!vpsDeleted) {
      console.warn(`⚠️ La suppression du VPS a échoué, mais on continue avec Firestore...`);
    }

    // 2. Supprimer de Firestore
    console.log('Step 2: Suppression de Firestore...');
    const firestoreDeleted = await deleteSiteFromFirestore(userId, siteId);

    // Résultat final
    const success = vpsDeleted && firestoreDeleted;
    const status = success ? 200 : 206; // 206 = Partial Content (suppression partielle)
    
    const message = success 
      ? `✅ Site ${siteName} entièrement supprimé (VPS + Firestore)`
      : vpsDeleted && !firestoreDeleted
        ? `⚠️ Site ${siteName} supprimé du VPS, mais reste dans Firestore`
        : `⚠️ Erreur lors de la suppression du VPS - Firestore non modifié`;

    console.log(`\n${message}`);
    console.log(`Suppression complète: VPS=${vpsDeleted}, Firestore=${firestoreDeleted}`);

    // 🎯 Enregistrer l'action dans l'audit log
    if (success) {
      try {
        const db = getFirestore(adminApp);
        const auditRef = db.collection('users').doc(userId).collection('audit_logs');
        await auditRef.add({
          action: 'DELETE',
          title: 'Suppression de site',
          description: `Suppression du site: ${siteName}`,
          timestamp: Date.now(),
          resourceId: siteId,
          resourceType: 'site',
          ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        });
        console.log(`✅ Audit log créé pour la suppression de ${siteName}`);
      } catch (auditError) {
        console.error('⚠️ Erreur lors de la création du log audit:', auditError);
        // Ne pas bloquer la suppression si l'audit log échoue
      }
    }

    return NextResponse.json(
      {
        success,
        message,
        siteName,
        vpsDeleted,
        firestoreDeleted,
      },
      { status }
    );
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la suppression du site',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
