import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { promises as fs } from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Fonction pour lire les fichiers depuis le VPS via SSH
const readProjectFilesViaSSH = async (projectPath: string, maxFiles: number = 50): Promise<FileContent[]> => {
  try {
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    console.log(`🔗 Connexion SSH au VPS...`);
    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });
    console.log(`✅ SSH connecté à ${process.env.DEPLOY_SSH_HOST}`);

    const files: FileContent[] = [];
    
    // Vérifier que le répertoire existe
    const testCmd = `[ -d "${projectPath}" ] && echo "EXISTS" || echo "NOT_FOUND"`;
    const testResult = await ssh.execCommand(testCmd);
    console.log(`   Test répertoire ${projectPath}:`, testResult.stdout.trim());
    
    if (!testResult.stdout.includes('EXISTS')) {
      console.warn(`❌ Répertoire n'existe pas: ${projectPath}`);
      ssh.dispose();
      return [];
    }
    
    // Lire les fichiers de manière récursive via SSH
    const findCmd = `find ${projectPath} -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.next/*' | head -${maxFiles}`;
    console.log(`   Exécution find...`);
    const findResult = await ssh.execCommand(findCmd);
    
    if (findResult.code !== 0) {
      console.warn(`❌ SSH find failed (code ${findResult.code}): ${findResult.stderr}`);
      ssh.dispose();
      return [];
    }

    const fileList = findResult.stdout.split('\n').filter(Boolean);
    console.log(`   ✅ Fichiers trouvés: ${fileList.length}`);
    
    for (const filePath of fileList) {
      if (files.length >= maxFiles) break;
      
      // Lire le contenu du fichier
      const readCmd = `cat "${filePath}"`;
      const readResult = await ssh.execCommand(readCmd);
      
      if (readResult.code === 0) {
        const content = readResult.stdout;
        
        // Limiter la taille du contenu (max 100KB par fichier)
        if (content.length <= 102400) {
          const relativePath = filePath.replace(projectPath + '/', '');
          files.push({
            name: path.basename(filePath),
            path: relativePath,
            language: getLanguageFromExtension(filePath),
            content: content
          });
        }
      }
    }
    
    console.log(`✅ ${files.length} fichiers lus via SSH`);
    ssh.dispose();
    return files;
  } catch (error: any) {
    console.error('❌ Erreur SSH:', error.message || String(error));
    return [];
  }
};

interface FileContent {
  name: string;
  content: string;
  language: string;
  path: string;
}

// Détermine le langage en fonction de l'extension
const getLanguageFromExtension = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.md': 'markdown',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.env': 'properties',
    '.sql': 'sql',
    '.sh': 'bash',
    '.py': 'python',
  };
  return languageMap[ext] || 'text';
};

// Récursivement lire les fichiers du projet
const readProjectFiles = async (projectPath: string, basePath: string = '', maxFiles: number = 50): Promise<FileContent[]> => {
  const files: FileContent[] = [];
  let fileCount = 0;

  const ignoreDirs = ['node_modules', '.next', '.git', '.vercel', 'dist', 'build', '.env.local'];
  const ignoreFiles = ['.DS_Store', '.gitignore'];

  const traverse = async (dir: string, relPath: string = '') => {
    if (fileCount >= maxFiles) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (fileCount >= maxFiles) break;

        const fullPath = path.join(dir, entry.name);
        const relativePath = relPath ? `${relPath}/${entry.name}` : entry.name;

        // Ignorer les dossiers et fichiers inutiles
        if (entry.isDirectory()) {
          if (!ignoreDirs.includes(entry.name)) {
            await traverse(fullPath, relativePath);
          }
        } else {
          if (!ignoreFiles.includes(entry.name) && fileCount < maxFiles) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              
              // Limiter la taille du contenu (max 100KB par fichier)
              if (content.length > 102400) {
                continue;
              }

              files.push({
                name: entry.name,
                path: relativePath,
                language: getLanguageFromExtension(entry.name),
                content: content
              });
              fileCount++;
            } catch (err) {
              // Ignore les erreurs de lecture (fichiers binaires, etc)
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err);
    }
  };

  await traverse(projectPath);
  return files;
};

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const projectId = request.headers.get('x-project-id');

  if (!userId || !projectId) {
    return NextResponse.json(
      { error: 'Paramètres manquants' },
      { status: 400 }
    );
  }

  try {
    // Récupérer les infos du projet
    const projectRef = doc(db, 'users', userId, 'sites', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      );
    }

    const projectData = projectSnap.data();
    const projectName = projectData?.siteName || projectData?.name || 'Mon Projet';
    const domain = projectData?.domain || '';
    
    console.log(`📂 Récupération fichiers pour ${projectId}:`);
    console.log(`   Projet: ${projectName}`);
    console.log(`   Domaine utilisé: ${domain || '(vide)'}`);
    
    // Construire le chemin du projet: /var/www/{domain}
    // Utiliser le domaine directement (le symlink est créé avec le domaine exact)
    let projectPath = '';
    
    if (domain) {
      projectPath = `/var/www/${domain}`;
    } else {
      // Fallback: utiliser le nom du projet formaté
      const siteName = projectName.toLowerCase().replace(/\s+/g, '-');
      projectPath = `/var/www/${siteName}`;
    }
    
    console.log(`   Chemin: ${projectPath}`);

    // Vérifier que le dossier existe localement ou sur le VPS
    let files: FileContent[] = [];
    
    try {
      await fs.access(projectPath);
      // Lire localement si le chemin existe
      files = await readProjectFiles(projectPath);
      console.log(`✅ Fichiers lus localement depuis ${projectPath}`);
    } catch (err: any) {
      // Si le dossier n'existe pas localement, essayer via SSH (déploiement sur VPS)
      console.warn(`⚠️ Dossier inexistant localement: ${projectPath}`);
      console.warn(`   Erreur locale:`, err.code);
      console.warn(`   → Tentative lecture via SSH...`);
      
      // Essayer de lire via SSH depuis le VPS
      const sshPath = projectPath.startsWith('/var/www/') ? projectPath : `/var/www/${domain || projectName}`;
      console.log(`   Chemin SSH: ${sshPath}`);
      files = await readProjectFilesViaSSH(sshPath);
      
      if (files.length === 0) {
        // Si SSH aussi échoue, retourner le message par défaut
        console.warn(`❌ Aucun fichier lus via SSH: ${sshPath}`);
        return NextResponse.json({
          files: [
            {
              name: 'README.md',
              path: 'README.md',
              language: 'markdown',
              content: `# ${projectName}\n\nLe projet n'a pas été trouvé localement ni sur le serveur VPS.\n\nVérifiez que le déploiement s'est bien déroulé.`
            }
          ],
          total: 1,
          project: { id: projectId, name: projectName },
          source: 'error'
        });
      }
      
      console.log(`✅ ${files.length} fichiers lus via SSH`);
    }

    // Ajouter un README si le projet est vide
    if (files.length === 0) {
      files.push({
        name: 'README.md',
        path: 'README.md',
        language: 'markdown',
        content: `# ${projectName}\n\nProjet vide. Commencez à ajouter des fichiers!`
      });
    }

    return NextResponse.json({
      files,
      total: files.length,
      project: { id: projectId, name: projectName, domain },
      source: 'filesystem'
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des fichiers', details: String(error) },
      { status: 500 }
    );
  }
}
