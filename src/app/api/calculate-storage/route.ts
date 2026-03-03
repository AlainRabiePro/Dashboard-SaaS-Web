import { NextRequest, NextResponse } from 'next/server';

// Map des plans avec leurs limites de stockage (en GB)
const PLAN_STORAGE_LIMITS: Record<string, number> = {
  basic: 5,
  professional: 15,
  enterprise: 100,
};

function getPlanStorageLimit(plan: string): number {
  return PLAN_STORAGE_LIMITS[plan.toLowerCase()] ?? PLAN_STORAGE_LIMITS.basic;
}

async function calculateStorageForUser(
  userId: string,
  siteNames: string[],
  storageLimit: number
): Promise<{ [domain: string]: number; totalGB: number; limitGB: number }> {
  // Import dynamique pour éviter le bundling côté client
  const { NodeSSH } = require('node-ssh');
  const ssh = new NodeSSH();

  try {
    const sshHost = process.env.DEPLOY_SSH_HOST;
    const sshUser = process.env.DEPLOY_SSH_USER;
    const sshPassword = process.env.DEPLOY_SSH_PASSWORD;
    let sshPrivateKey = process.env.DEPLOY_SSH_PRIVATE_KEY;

    if (!sshHost || !sshUser) {
      throw new Error('Configuration SSH manquante');
    }

    if (sshPrivateKey && !sshPrivateKey.startsWith('-----BEGIN')) {
      try {
        sshPrivateKey = Buffer.from(sshPrivateKey, 'base64').toString('utf-8');
      } catch (e) {
        console.error('Erreur de décodage de la clé privée');
      }
    }

    await ssh.connect({
      host: sshHost,
      username: sshUser,
      password: sshPassword,
      privateKey: sshPrivateKey,
      readyTimeout: 30000,
    });

    const storageMap: { [domain: string]: number } = {};
    let totalGB = 0;

    // Pour chaque site, calculer sa taille en convertissant le nom du site en chemin VPS
    for (const siteName of siteNames) {
      // Transformer le nom du site en chemin VPS
      // "instacraft.fr" -> "instacraft-fr"
      const siteDir = `/var/www/users/${userId}/sites/${siteName.toLowerCase().replace(/\./g, '-')}`;
      
      // Utiliser du -sb pour obtenir la taille en bytes
      const result = await ssh.execCommand(`du -sb "${siteDir}" 2>/dev/null | awk '{print $1}'`);
      
      if (result.code === 0 && result.stdout) {
        const bytes = parseInt(result.stdout.trim());
        const gb = bytes / (1024 * 1024 * 1024); // Convertir en GB
        // Garder la vraie valeur même si elle est très petite (jusqu'à 8 décimales)
        storageMap[siteName] = parseFloat(gb.toFixed(8));
        console.log(`📊 ${siteName}: ${gb.toFixed(8)} GB (${bytes} bytes)`);
      } else {
        storageMap[siteName] = 0;
        console.log(`⚠️ ${siteName}: Répertoire non trouvé à ${siteDir}`);
      }
    }

    const limitGB = storageLimit;
    totalGB = Object.values(storageMap).reduce((a, b) => a + b, 0);

    console.log(`Storage for user ${userId}:`, {
      storageMap,
      totalGB: parseFloat(totalGB.toFixed(8)),
      limitGB,
    });

    return {
      ...storageMap,
      totalGB: parseFloat(totalGB.toFixed(8)),
      limitGB,
    };
  } finally {
    ssh.dispose();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification par token Bearer
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer les données du body
    const body = await request.json();
    const { userId, siteNames, storageLimit: clientStorageLimit, plan } = body;

    if (!userId || !siteNames || (!clientStorageLimit && !plan)) {
      return NextResponse.json(
        { error: 'Données manquantes: userId, siteNames, et (storageLimit OU plan) requis' },
        { status: 400 }
      );
    }

    // Calculer la limite de stockage autorisée basée sur le plan
    // Ceci est la SOURCE OF TRUTH côté serveur (sécurité)
    const authorizedLimit = plan 
      ? getPlanStorageLimit(plan)
      : clientStorageLimit;

    // Validation de sécurité: vérifier que le client ne demande pas plus que son plan
    if (clientStorageLimit && clientStorageLimit > authorizedLimit) {
      console.warn(
        `[SECURITY] User ${userId} attempted to use higher storage limit: requested=${clientStorageLimit}, authorized=${authorizedLimit}, plan=${plan}`
      );
    }

    const finalStorageLimit = authorizedLimit;

    if (siteNames.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun site trouvé',
        storage: {},
        totalGB: 0,
        limitGB: finalStorageLimit,
        usagePercent: 0,
      });
    }

    // Calculer le stockage uniquement pour les sites de cet utilisateur
    const storageData = await calculateStorageForUser(userId, siteNames, finalStorageLimit);

    const usagePercent = (storageData.totalGB / storageData.limitGB) * 100;

    return NextResponse.json({
      success: true,
      message: 'Stockage calculé avec succès',
      plan: plan || 'unknown',
      storage: storageData,
      totalGB: storageData.totalGB,
      limitGB: storageData.limitGB,
      usagePercent: parseFloat(usagePercent.toFixed(1)),
    });
  } catch (error: any) {
    console.error('Erreur de calcul stockage:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors du calcul',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
