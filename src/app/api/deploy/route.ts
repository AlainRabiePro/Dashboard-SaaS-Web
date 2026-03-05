import { NextRequest, NextResponse } from 'next/server';
import { resolveTxt, resolveCname } from 'dns/promises';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

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

// Vérifier que le domaine n'existe pas déjà pour cet utilisateur
async function isDomainAlreadyDeployed(userId: string, domain: string): Promise<boolean> {
  try {
    // Utiliser Firebase Admin SDK pour la vérification côté serveur
    const admin = require('firebase-admin');
    const adminDb = admin.firestore();
    
    const sitesRef = adminDb.collection('users').doc(userId).collection('sites');
    const snapshot = await sitesRef.where('domain', '==', domain).get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Erreur lors de la vérification du domaine:', error);
    // En cas d'erreur, on retourne false pour ne pas bloquer
    return false;
  }
}

// ✅ NOUVEAU : Vérifier que le repo Git existe et est accessible
async function verifyGitRepositoryAccess(repoUrl: string): Promise<{ accessible: boolean; error?: string }> {
  try {
    const { execSync } = require('child_process');
    
    // Tenter une connexion git ls-remote pour vérifier l'accès
    // Cela vérifie que le repo existe ET qu'on peut y accéder
    const result = execSync(`git ls-remote --heads ${repoUrl}`, {
      timeout: 10000, // 10 secondes
      stdio: 'pipe',
    }).toString();
    
    // Si on arrive ici, le repo est accessible
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

// ✅ NOUVEAU : Vérifier la propriété du domaine via TXT record DNS
async function verifyDomainOwnership(domain: string, userId: string, validationToken: string): Promise<{ verified: boolean; error?: string; requiredRecord?: string }> {
  try {
    // Le TXT record que l'utilisateur doit ajouter
    const requiredRecord = `dashboard-saas-${userId}-${validationToken}`;
    
    // Chercher le TXT record
    const txtRecords = await resolveTxt(domain);
    console.log(`🔍 TXT records pour ${domain}:`, txtRecords);
    
    // Vérifier si le TXT record requis existe
    for (const records of txtRecords) {
      const txtValue = records.join('');
      console.log(`   Checking: ${txtValue}`);
      if (txtValue.includes(requiredRecord)) {
        console.log(`✅ TXT record trouvé pour ${domain}`);
        return { verified: true };
      }
    }
    
    // TXT record non trouvé
    return { 
      verified: false, 
      error: `TXT record de vérification non trouvé pour ${domain}`,
      requiredRecord 
    };
  } catch (error: any) {
    console.error('Erreur lors de la vérification DNS:', error.message);
    
    let errorMessage = 'Impossible de vérifier le domaine';
    
    if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      errorMessage = `Le domaine "${domain}" n'existe pas ou n'a pas de records DNS configurés`;
    } else if (error.code === 'ENODATA') {
      errorMessage = `Aucun TXT record trouvé pour "${domain}". Vérifiez que le record a été ajouté.`;
    }
    
    return { verified: false, error: errorMessage };
  }
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

    // ✅ NOUVEAU : Vérifier que le repo Git existe et est accessible
    console.log('🔍 Vérification de l\'accès au repository...');
    const repoCheck = await verifyGitRepositoryAccess(body.repoUrl);
    if (!repoCheck.accessible) {
      return NextResponse.json(
        { 
          error: repoCheck.error || 'Le repository n\'est pas accessible',
          code: 'REPO_NOT_ACCESSIBLE'
        },
        { status: 400 }
      );
    }
    console.log('✅ Repository accessible');

    // ✅ NOUVEAU : Vérifier la propriété du domaine
    console.log('🔐 Vérification de la propriété du domaine...');
    const validationToken = Math.random().toString(36).substring(2, 10); // Token aléatoire
    const domainCheck = await verifyDomainOwnership(body.domain, body.userId, validationToken);
    if (!domainCheck.verified) {
      return NextResponse.json(
        { 
          error: domainCheck.error || 'Impossible de vérifier la propriété du domaine',
          code: 'DOMAIN_OWNERSHIP_UNVERIFIED',
          verification: {
            domain: body.domain,
            requiredTxtRecord: domainCheck.requiredRecord,
            instructions: `Ajoutez ce TXT record à votre domaine: ${domainCheck.requiredRecord}`
          }
        },
        { status: 403 } // 403 Forbidden
      );
    }
    console.log('✅ Propriété du domaine vérifiée');

    // ✅ Vérifier que le domaine n'existe pas déjà
    const domainAlreadyExists = await isDomainAlreadyDeployed(body.userId, body.domain);
    if (domainAlreadyExists) {
      return NextResponse.json(
        { 
          error: 'Ce domaine est déjà déployé',
          message: `Le domaine "${body.domain}" est déjà associé à un de vos sites. Veuillez utiliser un domaine différent ou supprimer le déploiement existant.`,
          code: 'DOMAIN_ALREADY_DEPLOYED'
        },
        { status: 409 } // 409 Conflict
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
