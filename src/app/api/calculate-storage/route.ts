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
  const NodeSSH = require('node-ssh').NodeSSH;
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

    // Construire la commande avec SEULEMENT les sites de cet utilisateur
    // Les sites sont maintenant dans /var/www/users/{userId}/sites/
    const domainPaths = siteNames
      .map(name => `/var/www/users/${userId}/sites/${name}`)
      .join(' ');
    const command = `du -sh ${domainPaths} 2>/dev/null | awk '{print $2 ":" $1}'`;
    const result = await ssh.execCommand(command);

    const storageMap: { [domain: string]: number } = {};
    let totalGB = 0;

    if (result.code === 0 && result.stdout) {
      const lines = result.stdout.trim().split('\n');
      lines.forEach((line: string) => {
        const [path, size] = line.split(':');
        if (path && size) {
          const domain = path.split('/').filter(Boolean).pop();
          if (domain) {
            let sizeNum = parseFloat(size);
            if (size.includes('K')) {
              sizeNum = sizeNum / 1024 / 1024;
            } else if (size.includes('M')) {
              sizeNum = sizeNum / 1024;
            } else if (size.includes('G')) {
              sizeNum = sizeNum;
            }
            const sizeGB = parseFloat(sizeNum.toFixed(2));
            storageMap[domain] = sizeGB;
            totalGB += sizeGB;
          }
        }
      });
    }

    const limitGB = storageLimit;

    console.log(`Storage for user ${userId}:`, {
      storageMap,
      totalGB: parseFloat(totalGB.toFixed(2)),
      limitGB,
    });

    return {
      ...storageMap,
      totalGB: parseFloat(totalGB.toFixed(2)),
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
