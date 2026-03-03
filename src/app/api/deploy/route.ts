import { NextRequest, NextResponse } from 'next/server';

// Types
interface DeployRequest {
  userId: string;
  domain: string;
  repoUrl: string;
  adsenseId?: string;
}

// Middleware pour vérifier que le token est présent (simple validation)
// En production, tu peux vérifier via Firebase Admin SDK si besoin
async function verifyAuth(token: string): Promise<boolean> {
  // Pour l'instant, on vérifie juste que le token est présent
  // Le token est généré côté client et contient les données utilisateur
  return token.length > 0;
}

// Fonction pour exécuter le déploiement via SSH
async function deployViaSsh(domain: string, repoUrl: string, userId: string, adsenseId?: string): Promise<string> {
  const NodeSSH = require('node-ssh').NodeSSH;
  
  const ssh = new NodeSSH();

  try {
    // Récupérer les variables d'environnement pour la connexion SSH
    const sshHost = process.env.DEPLOY_SSH_HOST;
    const sshUser = process.env.DEPLOY_SSH_USER;
    const sshPassword = process.env.DEPLOY_SSH_PASSWORD;
    let sshPrivateKey = process.env.DEPLOY_SSH_PRIVATE_KEY;
    const deployScriptPath = process.env.DEPLOY_SCRIPT_PATH || '/home/deploy/deploy.sh';

    if (!sshHost || !sshUser) {
      throw new Error('Configuration SSH manquante (DEPLOY_SSH_HOST, DEPLOY_SSH_USER)');
    }

    // Si la clé privée est en base64, la décoder
    if (sshPrivateKey && !sshPrivateKey.startsWith('-----BEGIN')) {
      try {
        sshPrivateKey = Buffer.from(sshPrivateKey, 'base64').toString('utf-8');
      } catch (e) {
        console.error('Erreur de décodage de la clé privée');
      }
    }

    // Connexion SSH
    await ssh.connect({
      host: sshHost,
      username: sshUser,
      password: sshPassword,
      privateKey: sshPrivateKey,
      readyTimeout: 30000,
    });

    // Construire la commande de déploiement
    // L'ordre des réponses doit correspondre à celui du script:
    // 1. Lien du repo
    // 2. Nom de domaine
    // 3. Confirmation (o/n)
    // 4. AdSense (o/n)
    // 5. ID AdSense (optionnel)
    let responses = `${repoUrl}\n${domain}\no`;
    
    if (adsenseId) {
      responses += `\no\n${adsenseId}`;
    } else {
      responses += `\nn`;
    }
    
    const command = `printf "${responses}" | bash ${deployScriptPath}`;

    // Exécuter le script
    const result = await ssh.execCommand(command, {
      cwd: '/tmp',
      timeout: 30 * 60 * 1000, // 30 minutes
    });

    console.log('SSH Command Result:', {
      code: result.code,
      stdout: result.stdout.substring(0, 500), // premiers 500 chars
      stderr: result.stderr,
    });

    if (result.code !== 0) {
      throw new Error(`Erreur de déploiement: ${result.stderr || result.stdout}`);
    }

    // Après le déploiement réussi, créer le lien symbolique pour organiser par utilisateur
    const domainSafe = domain.toLowerCase().replace(/\./g, '-');
    const sourceDir = `/var/www/${domainSafe}`;
    const targetDir = `/var/www/users/${userId}/sites/${domainSafe}`;
    const linkCommand = `mkdir -p /var/www/users/${userId}/sites && ln -sfn ${sourceDir} ${targetDir}`;

    const linkResult = await ssh.execCommand(linkCommand);
    if (linkResult.code !== 0) {
      console.warn(`[Avertissement] Lien symbolique non créé: ${linkResult.stderr}`);
      // Ne pas bloquer le déploiement si le lien échoue
    } else {
      console.log(`✅ Lien symbolique créé: ${targetDir} -> ${sourceDir}`);
    }

    return result.stdout;
  } finally {
    ssh.dispose();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const isValid = await verifyAuth(token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    // Parser le body
    const body: DeployRequest = await request.json();
    console.log('Deploy request:', { userId: body.userId, domain: body.domain, repoUrl: body.repoUrl });

    // Valider les entrées
    if (!body.userId || !body.domain || !body.repoUrl) {
      return NextResponse.json(
        { error: 'UserId, domain et repoUrl sont requis', received: body },
        { status: 400 }
      );
    }

    // Valider le format de l'userId (alphanumèrique et traits d'union)
    if (!/^[a-zA-Z0-9_-]+$/.test(body.userId)) {
      return NextResponse.json(
        { error: `Format d'userId invalide: "${body.userId}"` },
        { status: 400 }
      );
    }

    // Valider le format du domaine
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(body.domain)) {
      return NextResponse.json(
        { error: `Format de domaine invalide: "${body.domain}"` },
        { status: 400 }
      );
    }

    // Valider l'URL Git
    const gitRegex = /^https?:\/\/.+\.git$/;
    if (!gitRegex.test(body.repoUrl)) {
      return NextResponse.json(
        { error: `URL Git invalide: "${body.repoUrl}" (doit terminer par .git)` },
        { status: 400 }
      );
    }

    // Exécuter le déploiement
    const output = await deployViaSsh(body.domain, body.repoUrl, body.userId, body.adsenseId);

    return NextResponse.json({
      success: true,
      message: 'Déploiement lancé avec succès',
      domain: body.domain,
      output: output,
    });

  } catch (error: any) {
    console.error('Erreur de déploiement:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors du déploiement',
        message: error.message || error.stderr,
      },
      { status: 500 }
    );
  }
}
