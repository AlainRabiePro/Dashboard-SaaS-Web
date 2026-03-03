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
    
    // Construire le chemin du projet: /var/www/{domain-formatted}
    let projectPath = '';
    
    if (domain) {
      const siteName = domain.replace(/\./g, '-');
      projectPath = `/var/www/${siteName}`;
    } else {
      // Fallback: utiliser le nom du projet formaté
      const siteName = projectName.toLowerCase().replace(/\s+/g, '-');
      projectPath = `/var/www/${siteName}`;
    }

    // Vérifier que le dossier existe
    try {
      await fs.access(projectPath);
    } catch {
      // Si le dossier n'existe pas en production, retourner des fichiers par défaut
      console.warn(`Project directory not found: ${projectPath}`);
      
      return NextResponse.json({
        files: [
          {
            name: 'README.md',
            path: 'README.md',
            language: 'markdown',
            content: `# ${projectName}\n\nCe projet n'a pas encore été déployé sur le serveur.\n\nDéployez-le via la section "Déploiements" du dashboard.`
          }
        ],
        total: 1,
        project: { id: projectId, name: projectName },
        source: 'default'
      });
    }

    // Lire les vrais fichiers du projet
    const files = await readProjectFiles(projectPath);

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
