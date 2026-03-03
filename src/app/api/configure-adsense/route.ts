import { NextRequest, NextResponse } from 'next/server';

interface ConfigureAdsenseRequest {
  siteId: string;
  userId: string;
  domain: string;
  adsenseId: string;
}

async function configureAdsenseViaSsh(domain: string, userId: string, adsenseId: string): Promise<string> {
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

    const siteName = domain.replace(/\./g, '-');
    // Utiliser la nouvelle structure avec userId
    const siteDirNew = `/var/www/users/${userId}/sites/${siteName}`;
    const siteDirLegacy = `/var/www/${siteName}`;
    
    // Déterminer le chemin à utiliser (nouveau d'abord, puis fallback à l'ancien)
    const checkPath = `if [ -d "${siteDirNew}" ]; then echo "new"; else echo "legacy"; fi`;
    const pathResult = await ssh.execCommand(checkPath);
    const siteDir = pathResult.stdout.trim() === 'new' ? siteDirNew : siteDirLegacy;
    
    console.log(`Using site directory: ${siteDir}`);

    // Créer ads.txt (essayer dans public d'abord, sinon à la racine)
    const adsContent = `google.com, ${adsenseId}, DIRECT, f08c47fec0942fa0`;
    
    // Créer le dossier public s'il n'existe pas
    const ensurePublic = `mkdir -p ${siteDir}/public`;
    const createAdsTxt = `echo "${adsContent}" > ${siteDir}/public/ads.txt && chmod 644 ${siteDir}/public/ads.txt`;
    
    // Fallback: créer à la racine aussi
    const createAdsTxtRoot = `echo "${adsContent}" > ${siteDir}/ads.txt && chmod 644 ${siteDir}/ads.txt`;

    // Injecter le script AdSense dans les fichiers HTML
    const adsenseTag = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}" crossorigin="anonymous"><\\/script>`;
    
    const injectScript = `find ${siteDir} -name "*.html" ! -path "*/node_modules/*" 2>/dev/null | head -20 | while read file; do if ! grep -q "adsbygoogle" "$file" 2>/dev/null; then sed -i "s|</head>|  ${adsenseTag}\\n</head>|" "$file" 2>/dev/null || true; fi; done`;

    // Exécuter les commandes
    await ssh.execCommand(ensurePublic);
    const result1 = await ssh.execCommand(createAdsTxt);
    const result2 = await ssh.execCommand(createAdsTxtRoot);
    const result3 = await ssh.execCommand(injectScript);
    
    // Ajouter une location spéciale dans Nginx pour servir les fichiers statiques ads.txt
    const nginxConfigPath = `/etc/nginx/sites-available/${siteName}`;
    const addLocationBlock = `
cat > /tmp/nginx_location.txt << 'NGINX'
    location = /ads.txt {
        alias ${siteDir}/public/ads.txt;
    }
NGINX
sed -i '/location \\/ {/r /tmp/nginx_location.txt' ${nginxConfigPath}
rm -f /tmp/nginx_location.txt
nginx -t && nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null || true
    `;
    
    await ssh.execCommand(addLocationBlock);
    
    console.log('AdSense Configuration Result:', {
      ensurePublic: 'done',
      createAdsTxt: result1.code,
      createAdsTxtRoot: result2.code,
      injectScript: result3.code,
      nginxUpdate: 'done',
    });

    // On considère que c'est OK si au moins une des deux versions de ads.txt a marché
    if (result1.code !== 0 && result2.code !== 0) {
      throw new Error(`Erreur: impossible de créer ads.txt`);
    }

    return `AdSense configuré avec succès pour ${domain}`;
  } finally {
    ssh.dispose();
  }
}

async function verifyAuth(token: string): Promise<boolean> {
  return token.length > 0;
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

    const body: ConfigureAdsenseRequest = await request.json();
    console.log('Configure AdSense request:', { userId: body.userId, siteId: body.siteId, domain: body.domain });

    if (!body.userId || !body.domain || !body.adsenseId) {
      return NextResponse.json(
        { error: 'UserId, domain et adsenseId sont requis' },
        { status: 400 }
      );
    }

    // Extraire l'ID AdSense si l'utilisateur a copié la ligne complète ads.txt
    let cleanAdsenseId = body.adsenseId.trim();
    
    // Si c'est la ligne complète (contient "DIRECT"), on extrait juste l'ID
    if (cleanAdsenseId.includes('DIRECT')) {
      const match = cleanAdsenseId.match(/ca-pub-\d+/);
      if (match) {
        cleanAdsenseId = match[0];
      } else {
        // Essayer le format sans "ca-" au début
        const match2 = cleanAdsenseId.match(/pub-(\d+)/);
        if (match2) {
          cleanAdsenseId = `ca-pub-${match2[1]}`;
        }
      }
    }

    // Si pas de "ca-pub-" au début, l'ajouter
    if (!cleanAdsenseId.startsWith('ca-pub-')) {
      cleanAdsenseId = `ca-pub-${cleanAdsenseId}`;
    }

    // Valider le format final de l'ID AdSense
    if (!/^ca-pub-\d+$/.test(cleanAdsenseId)) {
      return NextResponse.json(
        { error: 'Format d\'ID AdSense invalide. Colle la ligne ads.txt ou l\'ID (ca-pub-XXXXXXXXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Valider le domaine
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(body.domain)) {
      return NextResponse.json(
        { error: `Format de domaine invalide: "${body.domain}"` },
        { status: 400 }
      );
    }

    // Configurer AdSense via SSH
    const output = await configureAdsenseViaSsh(body.domain, body.userId, cleanAdsenseId);

    return NextResponse.json({
      success: true,
      message: 'AdSense configuré avec succès',
      domain: body.domain,
      adsenseId: cleanAdsenseId,
      output: output,
    });

  } catch (error: any) {
    console.error('Erreur de configuration AdSense:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la configuration',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
